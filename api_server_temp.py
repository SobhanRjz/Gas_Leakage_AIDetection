"""FastAPI server for InfluxDB queries and CSV data generation."""

from abc import ABC, abstractmethod
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime
import logging
import pandas as pd
import os
from influxdb_client import InfluxDBClient
from src.backend.config import InfluxDBConfig, CSVConfig, LoggerConfig, ChatConfig
from src.backend.csv_service import CSVGenerationService
from src.backend.chat_service import ChatService
from src.backend.auth import router as auth_router, get_current_user
import traceback

# HI (Health Index) configuration with nominal values
HI_CONFIG = {
  "mechanical": {
    "sound_nom": 75.00071873,   # dB nominal (from sound_intensity_db)
    "to_lim": 54.9975205,       # oil temp nominal °C
    "tb_lim": 64.99322208,      # bearing temp nominal °C
    "disp_lim": 40.00441994,    # displacement nominal µm
    "acc_lim": 0.300002532,     # acceleration nominal g
    "vel_lim": 3.49898588,      # velocity nominal mm/s
  },
  "hydraulic": {
    "tout_nom": 55.00039175,    # outlet fluid temp °C
    "tin_nom": 45.0000938,      # inlet fluid temp °C
    "pd_nom": 6.500036003,      # outlet pressure bar
    "ps_nom": 2.500142497,      # inlet pressure bar
    "q_nom": 89.99412798        # flow rate m³/h
  },
  "electrical": {
    "p_nom": 20.0002695,        # kW
    "v_nom": 400.0013129,       # V
    "i_nom": 39.99980326        # A
  }
}

# Fault detection rules based on sensor thresholds
FAULT_RULES = {
  # limit-based sensors (warning near limit, failure above limit)
  "limits": {
    "oil_temp_c": {"warn_ratio": 0.85, "limit": HI_CONFIG["mechanical"]["to_lim"], "label": "High Oil Temperature"},
    "bearing_temp_c": {"warn_ratio": 0.85, "limit": HI_CONFIG["mechanical"]["tb_lim"], "label": "High Bearing Temperature"},
    "shaft_displacement_um": {"warn_ratio": 0.85, "limit": HI_CONFIG["mechanical"]["disp_lim"], "label": "High Shaft Displacement"},
    "accelerometer_g": {"warn_ratio": 0.85, "limit": HI_CONFIG["mechanical"]["acc_lim"], "label": "High Acceleration"},
    "vibration_velocity": {"warn_ratio": 0.85, "limit": HI_CONFIG["mechanical"]["vel_lim"], "label": "High Vibration Velocity"},
  },

  # nominal-based sensors (warning by deviation, failure by bigger deviation)
  "nominal": {
    "sound_intensity_db": {"warn_dev": 0.15, "fail_dev": 0.30, "nom": HI_CONFIG["mechanical"]["sound_nom"], "label": "High Sound Intensity"},
    "flow_rate_m3_h": {"warn_dev": 0.10, "fail_dev": 0.20, "nom": HI_CONFIG["hydraulic"]["q_nom"], "label": "Abnormal Flow Rate"},
    "inlet_pressure_bar": {"warn_dev": 0.10, "fail_dev": 0.20, "nom": HI_CONFIG["hydraulic"]["ps_nom"], "label": "Abnormal Suction Pressure"},
    "outlet_pressure_bar": {"warn_dev": 0.10, "fail_dev": 0.20, "nom": HI_CONFIG["hydraulic"]["pd_nom"], "label": "Abnormal Discharge Pressure"},
    "inlet_fluid_temp_c": {"warn_dev": 0.10, "fail_dev": 0.20, "nom": HI_CONFIG["hydraulic"]["tin_nom"], "label": "Abnormal Inlet Fluid Temp"},
    "outlet_fluid_temp_c": {"warn_dev": 0.10, "fail_dev": 0.20, "nom": HI_CONFIG["hydraulic"]["tout_nom"], "label": "Abnormal Outlet Fluid Temp"},
    "motor_current_a": {"warn_dev": 0.10, "fail_dev": 0.20, "nom": HI_CONFIG["electrical"]["i_nom"], "label": "Abnormal Motor Current"},
    "supply_voltage_v": {"warn_dev": 0.06, "fail_dev": 0.10, "nom": HI_CONFIG["electrical"]["v_nom"], "label": "Abnormal Supply Voltage"},
    "power_consumption_kw": {"warn_dev": 0.10, "fail_dev": 0.20, "nom": HI_CONFIG["electrical"]["p_nom"], "label": "Abnormal Power Consumption"},
  }
}

BASELINE_MEAN = {
  "accelerometer_g": 0.300002532,
  "vibration_velocity_mm_s": 3.49898588,
  "shaft_displacement_um": 40.00441994,
  "bearing_temp_c": 64.99322208,
  "oil_temp_c": 54.9975205,
  "casing_temp_c": 59.99964348,
  "inlet_fluid_temp_c": 45.0000938,
  "outlet_fluid_temp_c": 55.00039175,
  "inlet_pressure_bar": 2.500142497,
  "outlet_pressure_bar": 6.500036003,
  "flow_rate_m3_h": 89.99412798,
  "motor_current_a": 39.99980326,
  "supply_voltage_v": 400.0013129,
  "power_consumption_kw": 20.0002695,
  "sound_intensity_db": 75.00071873,
}

BASELINE_STD = {
  "accelerometer_g": 0.049997219,
  "vibration_velocity_mm_s": 0.400706654,
  "shaft_displacement_um": 4.997512061,
  "bearing_temp_c": 1.499359982,
  "oil_temp_c": 1.203530038,
  "casing_temp_c": 1.001719642,
  "inlet_fluid_temp_c": 0.800563365,
  "outlet_fluid_temp_c": 0.899973503,
  "inlet_pressure_bar": 0.050020314,
  "outlet_pressure_bar": 0.080030109,
  "flow_rate_m3_h": 1.997868975,
  "motor_current_a": 0.799864828,
  "supply_voltage_v": 2.994188307,
  "power_consumption_kw": 0.499433704,
  "sound_intensity_db": 1.999261905,
}

# Rules thresholds and persistence
Z_WARN = 2.0
Z_CRIT = 3.0
PERSIST_N = 1

_RULE_COUNTS = {}  # {sensor_key: {"warning": n, "failure": n}}


class IQueryService(ABC):
    """Interface for query operations."""

    @abstractmethod
    def query_time_range(self, start: str, stop: str, measurement: str) -> List[Dict]:
        """Query data within time range."""
        pass

    @abstractmethod
    def query_latest(self, measurement: str, limit: int) -> List[Dict]:
        """Query latest records."""
        pass

    @abstractmethod
    def query_sensor_context(self, minutes: int, measurement: str) -> Dict:
        """Query sensor statistics for last N minutes."""
        pass

    @abstractmethod
    def query_ml_status(self, limit: int, measurement: str) -> List[Dict]:
        """Query ML-driven health status and fault type."""
        pass

    @abstractmethod
    def query_overview_latest(self, measurement: str) -> Dict:
        """Query latest overview data including sensors, ML status, and fault type."""
        pass


class TimeRangeQuery(BaseModel):
    """Request model for time range queries."""
    start: str
    stop: str
    measurement: str = "sensor_measurements"


class LatestQuery(BaseModel):
    """Request model for latest data queries."""
    limit: int = 100
    measurement: str = "sensor_measurements"


class SensorContextQuery(BaseModel):
    """Request model for sensor context data."""
    minutes: int = 5
    measurement: str = "sensor_measurements"


class MLStatusQuery(BaseModel):
    """Request model for ML status data."""
    limit: int = 5
    measurement: str = "sensor_measurements"


class CSVGenerationRequest(BaseModel):
    """Request model for CSV generation."""
    csv_path: str
    measurement_name: str = "sensor_measurements"
    sleep_seconds: float = 2.0
    loop_forever: bool = True
    is_csv_status_enabled: bool = False


class ChatMessageRequest(BaseModel):
    """Request model for chat messages."""
    message: str
    sensor_context: str
    ml_status_context: str


class MaintenanceAIRefreshRequest(BaseModel):
    measurement: str = "sensor_measurements"
    minutes: int = 5
    limit_assets: int = 15  # how many rows you want


class MaintenanceRow(BaseModel):
    equipment: str
    component: str
    health_score: float
    risk_level: str
    failure_mode: str
    days_to_action: float
    trend: str
    action: str
    reason: Optional[str] = None


class MaintenanceAIRefreshResponse(BaseModel):
    generated_at: str
    assets: List[MaintenanceRow]


def _safe_float(x):
    try:
        if x is None:
            return None
        return float(x)
    except Exception:
        return None

def _clamp(v, lo, hi):
    return max(lo, min(hi, v))

def stats_to_mean_values(sensor_stats: dict) -> dict:
    # sensor_stats: { "accelerometer_g": {"mean":..., "min":..., ...}, ... }
    out = {}
    for k, v in (sensor_stats or {}).items():
        if isinstance(v, dict) and "mean" in v:
            out[k] = v["mean"]
    return out

def _safe(v):
    try:
        if v is None:
            return None
        return float(v)
    except Exception:
        return None

def _clamp_hi(x, lo=0.0, hi=100.0):
    if x is None:
        return None
    return max(lo, min(hi, x))

def _rel_abs(x, nom):
    x = _safe(x)
    nom = _safe(nom)
    if x is None or nom is None or nom == 0:
        return None
    return abs(x - nom) / nom

def compute_component_hi(means: dict, hi_cfg: dict) -> dict:
    """
    Returns: { "Casing": 87.1, "Bearing": 72.5, ... }
    If a component misses any required sensor -> value None (so GPT can mention missing).
    """

    # Nominals from your HI_CONFIG (already in api_server.py)
    p_nom = hi_cfg["hydraulic"]["pd_nom"]     # discharge nominal
    ps_nom = hi_cfg["hydraulic"]["ps_nom"]    # suction nominal
    q_nom = hi_cfg["hydraulic"]["q_nom"]
    i_nom = hi_cfg["electrical"]["i_nom"]
    v_nom = hi_cfg["electrical"]["v_nom"]
    pw_nom = hi_cfg["electrical"]["p_nom"]

    # Grab sensor means
    Acc   = means.get("accelerometer_g")
    Vel   = means.get("vibration_velocity_mm_s") or means.get("vibration_velocity")
    Disp  = means.get("shaft_displacement_um")
    T_b   = means.get("bearing_temp_c")
    T_oil = means.get("oil_temp_c")
    Sound = means.get("sound_intensity_db")
    P_out = means.get("outlet_pressure_bar")
    P_in  = means.get("inlet_pressure_bar")
    Q     = means.get("flow_rate_m3_h")
    T_in  = means.get("inlet_fluid_temp_c")
    T_out = means.get("outlet_fluid_temp_c")
    I     = means.get("motor_current_a")
    V     = means.get("supply_voltage_v")
    P     = means.get("power_consumption_kw")

    # Helper to require all terms for a component
    def require(*vals):
        return all(_safe(v) is not None for v in vals)

    out = {}

    # 1) Casing
    if require(Acc, Vel, Sound, P_out, T_out):
        hi = 100.0 * (1.0 - (((Acc/2)+(Vel/4.5)+(Sound/85)+_rel_abs(P_out, p_nom)+(T_out/60))/5.0))
        out["Casing"] = _clamp_hi(hi)
    else:
        out["Casing"] = None

    # 2) Bearing
    if require(Acc, Vel, Disp, T_b, T_oil, Sound, P):
        hi = 100.0 * (1.0 - (((Acc/2)+(Vel/4.5)+(Disp/50)+(T_b/80)+(T_oil/70)+(Sound/85)+_rel_abs(P, pw_nom))/7.0))
        out["Bearing"] = _clamp_hi(hi)
    else:
        out["Bearing"] = None

    # 3) Pump Shaft
    if require(Disp, Vel, Sound, P):
        hi = 100.0 * (1.0 - (((Disp/50)+(Vel/4.5)+(Sound/85)+_rel_abs(P, pw_nom))/4.0))
        out["Pump Shaft"] = _clamp_hi(hi)
    else:
        out["Pump Shaft"] = None

    # 4) Lubrication System
    if require(T_oil, T_b, Sound, P):
        hi = 100.0 * (1.0 - (((T_oil/70)+(T_b/80)+(Sound/85)+(P/pw_nom))/4.0))
        out["Lubrication System"] = _clamp_hi(hi)
    else:
        out["Lubrication System"] = None

    # 5) Motor
    if require(I, V, P, Sound):
        hi = 100.0 * (1.0 - ((_rel_abs(I, i_nom)+_rel_abs(V, v_nom)+_rel_abs(P, pw_nom)+(Sound/85))/4.0))
        out["Motor"] = _clamp_hi(hi)
    else:
        out["Motor"] = None

    # 6) Impeller
    if require(Acc, Vel, Q, P_out, Sound):
        hi = 100.0 * (1.0 - (((Acc/2)+(Vel/4.5)+_rel_abs(P_out, p_nom)+_rel_abs(Q, q_nom)+(Sound/85))/5.0))
        out["Impeller"] = _clamp_hi(hi)
    else:
        out["Impeller"] = None

    # 7) Mechanical Seal
    if require(T_b, T_oil, Sound, P_in):
        hi = 100.0 * (1.0 - (((T_b/80)+(T_oil/70)+(Sound/85)+_rel_abs(P_in, ps_nom))/4.0))
        out["Mechanical Seal"] = _clamp_hi(hi)
    else:
        out["Mechanical Seal"] = None

    # 8) Suction Pipe Side
    if require(P_in, Q, T_in, Sound):
        hi = 100.0 * (1.0 - ((_rel_abs(P_in, ps_nom)+_rel_abs(Q, q_nom)+(T_in/60)+(Sound/85))/4.0))
        out["Suction Pipe Side"] = _clamp_hi(hi)
    else:
        out["Suction Pipe Side"] = None

    # 9) Discharge Pipe Side
    if require(P_out, Q, T_out, Sound):
        hi = 100.0 * (1.0 - ((_rel_abs(P_out, p_nom)+_rel_abs(Q, q_nom)+(T_out/60)+(Sound/85))/4.0))
        out["Discharge Pipe Side"] = _clamp_hi(hi)
    else:
        out["Discharge Pipe Side"] = None

    # 10) Coupling / Alignment (same as Pump Shaft formula in your list)
    if require(Disp, Vel, Sound, P):
        hi = 100.0 * (1.0 - (((Disp/50)+(Vel/4.5)+(Sound/85)+_rel_abs(P, pw_nom))/4.0))
        out["Coupling / Alignment"] = _clamp_hi(hi)
    else:
        out["Coupling / Alignment"] = None

    return out

def _rel_excess_ratio(x, limit_or_nom):
    """
    returns normalized excess:
      if x <= limit -> 0
      if x >  limit -> (x/limit - 1)
    """
    x = _safe_float(x)
    if x is None or limit_or_nom <= 0:
        return None
    if x <= limit_or_nom:
        return 0.0
    return (x / limit_or_nom) - 1.0

def _rel_abs_error(x, nom):
    """
    normalized absolute error: |nom - x|/nom
    """
    x = _safe_float(x)
    if x is None or nom <= 0:
        return None
    return abs(nom - x) / nom

def _avg(values):
    vals = [v for v in values if v is not None]
    if not vals:
        return None
    return sum(vals) / len(vals)

def _ewma(values, alpha=0.25):
    if not values:
        return []
    out = [values[0]]
    for v in values[1:]:
        out.append(alpha * v + (1 - alpha) * out[-1])
    return out

def _slope_per_day(times_iso, values):
    """
    Simple linear regression slope in units/day.
    times_iso: list[str iso timestamps]
    values: list[float]
    """
    if len(values) < 5:
        return 0.0

    # convert to seconds relative
    from datetime import datetime
    ts = [datetime.fromisoformat(t.replace("Z", "+00:00")).timestamp() for t in times_iso]
    t0 = ts[0]
    x = [(t - t0) / 86400.0 for t in ts]  # days
    y = values

    n = len(y)
    x_mean = sum(x) / n
    y_mean = sum(y) / n
    num = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
    den = sum((x[i] - x_mean) ** 2 for i in range(n))
    if den <= 1e-12:
        return 0.0
    return num / den

def _rul_days_to_limit(current, rate_per_day, limit, direction="high"):
    """
    Returns days until reaching limit based on trend.
    If trend not moving toward limit => None.
    """
    current = _safe_float(current)
    if current is None or limit is None:
        return None

    if abs(rate_per_day) < 1e-9:
        return None

    if direction == "high":
        if rate_per_day <= 0:
            return None
        remaining = limit - current
        if remaining <= 0:
            return 0.0
        return remaining / rate_per_day

    # direction == "low"
    if rate_per_day >= 0:
        return None
    remaining = current - limit
    if remaining <= 0:
        return 0.0
    return remaining / abs(rate_per_day)

def compute_hi_from_sensors(sensors: dict, cfg: dict) -> dict:

    # --- Mechanical DI ---
    m = cfg["mechanical"]
    sound = sensors.get("sound_intensity_db")
    to = sensors.get("oil_temp_c")
    tb = sensors.get("bearing_temp_c")
    disp = sensors.get("shaft_displacement_um")
    acc = sensors.get("accelerometer_g")
    vel = sensors.get("vibration_velocity_mm_s") or sensors.get("vibration_velocity")
    # Mechanical damage terms - use absolute error for maximum sensitivity
    # Penalizes any deviation from nominal values (not just excesses)
    mech_terms = [
        _rel_abs_error(sound, m["sound_nom"]),  # sound: |x - nom| / nom
        _rel_abs_error(to, m["to_lim"]),        # oil temp: |x - nom| / nom
        _rel_abs_error(tb, m["tb_lim"]),        # bearing temp: |x - nom| / nom
        _rel_abs_error(disp, m["disp_lim"]),    # displacement: |x - nom| / nom
        _rel_abs_error(acc, m["acc_lim"]),      # acceleration: |x - nom| / nom
        _rel_abs_error(vel, m["vel_lim"]),      # velocity: |x - nom| / nom
    ]
    mech_di = _avg(mech_terms)
    mech_di_pct = None if mech_di is None else mech_di * 100.0
    hi_mech = None if mech_di_pct is None else _clamp(100.0 - mech_di_pct, 0.0, 100.0)

    # --- Hydraulic DI ---
    h = cfg["hydraulic"]
    tin = sensors.get("inlet_fluid_temp_c")
    tout = sensors.get("outlet_fluid_temp_c")
    ps = sensors.get("inlet_pressure_bar")
    pd = sensors.get("outlet_pressure_bar")
    q = sensors.get("flow_rate_m3_h")

    hyd_terms = [
        _rel_abs_error(tout, h["tout_nom"]),
        _rel_abs_error(tin, h["tin_nom"]),
        _rel_abs_error(pd, h["pd_nom"]),
        _rel_abs_error(ps, h["ps_nom"]),
        _rel_abs_error(q, h["q_nom"]),
    ]
    hyd_di = _avg(hyd_terms)
    hyd_di_pct = None if hyd_di is None else hyd_di * 100.0
    hi_hyd = None if hyd_di_pct is None else _clamp(100.0 - hyd_di_pct, 0.0, 100.0)

    # --- Electrical DI ---
    e = cfg["electrical"]
    p = sensors.get("power_consumption_kw")
    v = sensors.get("supply_voltage_v")
    i = sensors.get("motor_current_a")

    # Weight motor current higher for more sensitivity (0.5), voltage/power lower (0.25 each)
    ele_terms = [
        _rel_abs_error(p, e["p_nom"]),
        _rel_abs_error(v, e["v_nom"]),
        _rel_abs_error(i, e["i_nom"]),
    ]
    ele_di = _avg(ele_terms)
    ele_di_pct = None if ele_di is None else ele_di * 100.0
    hi_ele = None if ele_di_pct is None else _clamp(100.0 - ele_di_pct, 0.0, 100.0)

    # --- Pump HI ---
    if hi_mech is None and hi_hyd is None and hi_ele is None:
        hi_pump = None
    else:
        # if any component missing, treat missing as neutral weight removal
        parts = []
        weights = []
        if hi_mech is not None:
            parts.append(hi_mech); weights.append(0.4)
        if hi_hyd is not None:
            parts.append(hi_hyd); weights.append(0.3)
        if hi_ele is not None:
            parts.append(hi_ele); weights.append(0.3)
        wsum = sum(weights)
        hi_pump = _clamp(sum(p*w for p, w in zip(parts, weights)) / wsum, 0.0, 100.0)

    # Condition bucket
    def bucket(hi):
        if hi is None: return "unknown"
        if hi >= 70: return "normal"
        if hi >= 40: return "warning"
        return "critical"

    result = {
        "hi_pump": hi_pump,
        "condition": bucket(hi_pump),
        "hi_mechanical": hi_mech,
        "hi_hydraulic": hi_hyd,
        "hi_electrical": hi_ele,
        "damage_mechanical_pct": mech_di_pct,
        "damage_hydraulic_pct": hyd_di_pct,
        "damage_electrical_pct": ele_di_pct,
    }
    return result

def derive_fault_from_baseline(sensors: dict) -> dict:
    triggers = []

    def fnum(x):
        try:
            if x is None: return None
            return float(x)
        except Exception:
            return None

    def bump(key: str, severity: str, active: bool) -> int:
        # severity is "warning" or "failure"
        st = _RULE_COUNTS.setdefault(key, {"warning": 0, "failure": 0})
        if not active:
            st["warning"] = 0
            st["failure"] = 0
            return 0
        st[severity] += 1
        # if failure increments, warning count doesn't matter anymore
        if severity == "failure":
            st["warning"] = 0
        return st[severity]

    for key, mu in BASELINE_MEAN.items():
        sigma = BASELINE_STD.get(key)
        x = fnum(sensors.get(key))
        if x is None or sigma is None or sigma <= 0:
            continue

        z = (x - mu) / sigma
        az = abs(z)

        # decide severity now
        if az >= Z_CRIT:
            cnt = bump(key, "failure", True)
            if cnt >= PERSIST_N:
                triggers.append({
                    "key": key,
                    "severity": "failure",
                    "z": round(z, 2),
                    "value": x,
                    "mean": mu,
                    "std": sigma,
                    "message": f"{key} abnormal (|z|≥{Z_CRIT})"
                })
        elif az >= Z_WARN:
            cnt = bump(key, "warning", True)
            if cnt >= PERSIST_N:
                triggers.append({
                    "key": key,
                    "severity": "warning",
                    "z": round(z, 2),
                    "value": x,
                    "mean": mu,
                    "std": sigma,
                    "message": f"{key} deviating (|z|≥{Z_WARN})"
                })
        else:
            bump(key, "warning", False)

    if not triggers:
        return {
            "severity": "normal",
            "ml_status": "normal",
            "fault_type": "Normal operation",
            "triggers": []
        }

    # choose overall severity
    has_failure = any(t["severity"] == "failure" for t in triggers)
    overall = "failure" if has_failure else "warning"

    # pick top culprit by |z|
    culprit = max(triggers, key=lambda t: abs(t["z"]))

    return {
        "severity": overall,
        "ml_status": overall,         # your UI expects warning/failure/normal
        "fault_type": culprit["message"],
        "culprit_key": culprit["key"],
        "triggers": sorted(triggers, key=lambda t: abs(t["z"]), reverse=True)[:6]
    }


class InfluxDBQueryService(IQueryService):
    """Handles InfluxDB query operations."""
    
    def __init__(self, config: InfluxDBConfig, logger: logging.Logger):
        self.config = config
        self.logger = logger
        self._client: Optional[InfluxDBClient] = None
    
    def _get_client(self) -> InfluxDBClient:
        """Get or create InfluxDB client."""
        if self._client is None:
            self._client = InfluxDBClient(
                url=self.config.url,
                token=self.config.token,
                org=self.config.org
            )
        return self._client
    
    def query_time_range(self, start: str, stop: str, measurement: str) -> List[Dict]:
        """Query data within time range."""
        query = f'''
        from(bucket: "{self.config.bucket}")
            |> range(start: {start}, stop: {stop})
            |> filter(fn: (r) => r["_measurement"] == "{measurement}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
        '''
        
        try:
            client = self._get_client()
            query_api = client.query_api()
            tables = query_api.query(query, org=self.config.org)
            
            results = []
            for table in tables:
                for record in table.records:
                    row = {"time": record.get_time().isoformat()}
                    row.update({k: v for k, v in record.values.items() if not k.startswith("_")})
                    results.append(row)
            
            return results
        except Exception as e:
            self.logger.error(f"Query error: {e}")
            raise
    
    def query_latest(self, measurement: str, limit: int) -> List[Dict]:
        """Query latest records."""
        query = f'''
        from(bucket: "{self.config.bucket}")
            |> range(start: -1h)
            |> filter(fn: (r) => r["_measurement"] == "{measurement}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
            |> sort(columns: ["_time"], desc: true)
            |> limit(n: {limit})
        '''
        
        try:
            client = self._get_client()
            query_api = client.query_api()
            tables = query_api.query(query, org=self.config.org)
            
            results = []
            for table in tables:
                for record in table.records:
                    row = {"time": record.get_time().isoformat()}
                    row.update({k: v for k, v in record.values.items() if not k.startswith("_")})
                    results.append(row)
            
            return results
        except Exception as e:
            self.logger.error(f"Query error: {e}")
            raise

    def query_recent_series(self, measurement: str, hours: int = 6, limit: int = 200) -> List[Dict]:
        """
        Returns recent rows with pivot (time + fields). Used for RUL trend estimation.
        """
        query = f'''
        from(bucket: "{self.config.bucket}")
            |> range(start: -{hours}h)
            |> filter(fn: (r) => r["_measurement"] == "{measurement}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
            |> sort(columns: ["_time"], desc: true)
            |> limit(n: {limit})
            |> sort(columns: ["_time"], desc: false)
        '''
        client = self._get_client()
        query_api = client.query_api()
        tables = query_api.query(query, org=self.config.org)

        rows = []
        for table in tables:
            for record in table.records:
                row = {"time": record.get_time().isoformat()}
                row.update({k: v for k, v in record.values.items() if not k.startswith("_")})
                rows.append(row)
        return rows

    def query_sensor_context(self, minutes: int, measurement: str) -> Dict:
        """Query aggregated sensor statistics for last N minutes."""
        query = f'''
        from(bucket: "{self.config.bucket}")
            |> range(start: -{minutes}m)
            |> filter(fn: (r) => r["_measurement"] == "{measurement}")
            |> filter(fn: (r) => r["_field"] != "health_status" and r["_field"] != "fault_type")
        '''
        
        try:
            client = self._get_client()
            query_api = client.query_api()
            tables = query_api.query(query, org=self.config.org)
            
            sensor_data = {}
            for table in tables:
                for record in table.records:
                    field = record.get_field()
                    value = record.get_value()
                    
                    if field not in sensor_data:
                        sensor_data[field] = []
                    sensor_data[field].append(float(value))
            
            stats = {}
            for field, values in sensor_data.items():
                if values:
                    import statistics
                    stats[field] = {
                        "mean": round(statistics.mean(values), 4),
                        "std": round(statistics.stdev(values), 4) if len(values) > 1 else 0,
                        "min": round(min(values), 4),
                        "max": round(max(values), 4),
                        "count": len(values)
                    }
            
            return stats
        except Exception as e:
            self.logger.error(f"Sensor context query error: {e}")
            raise
    
    def query_ml_status(self, limit: int, measurement: str) -> List[Dict]:
        """Query ML-driven health status and fault type."""
        query = f'''
        from(bucket: "{self.config.bucket}")
            |> range(start: -1h)
            |> filter(fn: (r) => r["_measurement"] == "{measurement}")
            |> filter(fn: (r) => r["_field"] == "health_status_code")
            |> group(columns: [])
            |> sort(columns: ["_time"], desc: true)
            |> limit(n: {limit})
        '''

        try:
            client = self._get_client()
            query_api = client.query_api()
            tables = query_api.query(query, org=self.config.org)

            results = []
            for table in tables:
                for record in table.records:
                    row = {
                        "time": record.get_time().isoformat(),
                        "health_status_code": record.get_value(),
                        "health_status": record.values.get("health_status", "Unknown"),
                        "fault_type": record.values.get("fault_type", "none")
                    }
                    results.append(row)

            return results
        except Exception as e:
            self.logger.error(f"ML status query error: {e}")
            raise

    def query_overview_latest(self, measurement: str) -> Dict:
        """Query latest overview data including sensors, ML status, and fault type."""
        query = f'''
        from(bucket: "{self.config.bucket}")
            |> range(start: -7d)
            |> filter(fn: (r) => r["_measurement"] == "{measurement}")
            |> pivot(rowKey:["_time"], columnKey: ["_field"], valueColumn: "_value")
            |> sort(columns: ["_time"], desc: true)
            |> limit(n: 1)
        '''

        try:
            client = self._get_client()
            query_api = client.query_api()

            tables = query_api.query(query, org=self.config.org)

            # Collect all records to find the truly latest one across all tables
            all_records = []
            for table in tables:
                for record in table.records:
                    all_records.append(record)

            if all_records:
                # Find the record with the latest timestamp
                latest_record = max(all_records, key=lambda r: r.get_time())

                # Process the latest record
                ts = latest_record.get_time().isoformat()

                # Get all sensor values (exclude ML status fields from sensors)
                sensors = {}
                ml_status = "normal"
                fault_type = "none"

                for key, value in latest_record.values.items():
                    if not key.startswith("_"):
                        if key == "health_status":
                            # Map health_status to ml_status
                            status_lower = str(value).lower()
                            if status_lower in ["warning", "failure"]:
                                ml_status = status_lower
                            elif status_lower == "normal":
                                ml_status = "normal"
                            else:
                                ml_status = "normal"
                        elif key == "fault_type":
                            fault_type = str(value)
                        elif key not in ["health_status_code"]:  # Exclude ML-specific fields from sensors
                            sensors[key] = value

                # Map field names to match frontend expectations (bidirectional)
                if "vibration_velocity_mm_s" in sensors and "vibration_velocity" not in sensors:
                    sensors["vibration_velocity"] = sensors["vibration_velocity_mm_s"]
                if "vibration_velocity" in sensors and "vibration_velocity_mm_s" not in sensors:
                    sensors["vibration_velocity_mm_s"] = sensors["vibration_velocity"]

                # Compute HI from sensors
                hi = compute_hi_from_sensors(sensors, HI_CONFIG)

                # Derive fault status from sensors
                fault = derive_fault_from_baseline(sensors)

                # ---- RUL (trend + thresholds) ----
                rul = self._compute_rul(measurement, sensors)

                latest_data = {
                    "ts": ts,
                    # ✅ Keep ML results (from Influx)
                    "ml": {
                        "status": ml_status,
                        "fault_type": fault_type
                    },
                    # ✅ Rule-based results (from thresholds)
                    "fault": fault,
                    # (optional: keep these for backward-compat in UI)
                    "ml_status": ml_status,
                    "fault_type": fault["fault_type"],
                    "sensors": sensors,
                    "hi": hi,
                    "rul": rul,  # ✅ add this
                }
            else:
                latest_data = None

            if not latest_data:
                # Return default structure if no data found
                sensors = {}
                hi = compute_hi_from_sensors(sensors, HI_CONFIG)
                fault = derive_fault_from_baseline(sensors)
                rul = {
                    "equipment_rul_days": None,
                    "equipment_days_to_action": None,
                    "culprit_sensor": None,
                    "per_sensor": []
                }
                latest_data = {
                    "ts": datetime.now().isoformat(),
                    # ✅ Keep ML results (from Influx)
                    "ml": {
                        "status": "normal",
                        "fault_type": "none"
                    },
                    # ✅ Rule-based results (from thresholds)
                    "fault": fault,
                    # (optional: keep these for backward-compat in UI)
                    "ml_status": fault["ml_status"],
                    "fault_type": fault["fault_type"],
                    "sensors": sensors,
                    "hi": hi,
                    "rul": rul,
                }

            return latest_data
        except Exception as e:
            self.logger.error(f"Overview latest query error: {e}")
            raise

    def _compute_rul(self, measurement: str, latest_sensors: dict) -> dict:
        """
        Hybrid RUL: Simulation baseline + Trend acceleration
        - Simulation provides deterministic lifecycle (120 days)
        - Trends accelerate/decelerate based on sensor degradation
        """
        # Get simulation baseline
        sim_rul = _safe_float(latest_sensors.get("sim_rul_days"))
        sim_cycle = _safe_float(latest_sensors.get("csv_cycle_id"))

        if sim_rul is None:
            # Fall back to pure trend-based RUL if no simulation
            return self._compute_trend_rul(measurement, latest_sensors)

        try:
            # Get recent sensor data for trend analysis
            rows = self.query_recent_series(measurement, hours=6, limit=240)
        except Exception:
            rows = []

        # Compute trend acceleration factor
        acceleration_factor = self._compute_acceleration_factor(rows, latest_sensors)

        # Adjust simulated RUL based on trends
        # acceleration_factor > 1.0 means deteriorating faster (RUL decreases faster)
        # acceleration_factor < 1.0 means improving (RUL decreases slower)
        adjusted_rul = sim_rul * acceleration_factor

        # Ensure RUL doesn't go below 1 day or above 150 days
        adjusted_rul = max(1.0, min(150.0, adjusted_rul))

        action_when_remaining_days = 14.0
        days_to_action = max(0.0, adjusted_rul - action_when_remaining_days)

        return {
            "equipment_rul_days": float(adjusted_rul),
            "equipment_days_to_action": float(days_to_action),
            "culprit_sensor": None,  # Could compute this from trends
            "per_sensor": [],  # Could include trend analysis per sensor
            "mode": "hybrid",
            "csv_cycle_id": None if sim_cycle is None else float(sim_cycle),
            "acceleration_factor": acceleration_factor,
            "simulated_baseline": sim_rul,
        }

    def _compute_acceleration_factor(self, rows: List[Dict], latest_sensors: dict) -> float:
        """
        Compute how much faster/slower RUL should decrease based on sensor trends.
        Returns acceleration factor:
        - > 1.0: deteriorating faster than simulation (RUL decreases faster)
        - < 1.0: improving or stable (RUL decreases slower)
        - = 1.0: follows simulation exactly
        """
        if not rows:
            return 1.0  # No trend data, follow simulation

        critical_sensors = [
            "bearing_temp_c", "oil_temp_c", "vibration_velocity_mm_s",
            "motor_current_a", "power_consumption_kw"
        ]

        trend_severity = 0.0
        sensor_count = 0

        for sensor_key in critical_sensors:
            # Get recent values for this sensor
            series = []
            times = []
            for r in rows:
                v = _safe_float(r.get(sensor_key))
                timestamp = r.get("time", "")
                if v is not None and timestamp and timestamp.strip():
                    series.append(v)
                    times.append(timestamp)

            if len(series) < 8:
                continue

            # Apply EWMA smoothing
            smoothed = _ewma(series, alpha=0.25)

            # Compute trend slope
            slope = _slope_per_day(times, smoothed)

            # Get sensor baseline limits
            mu = BASELINE_MEAN.get(sensor_key)
            sd = BASELINE_STD.get(sensor_key)

            if mu is None or sd is None or slope == 0:
                continue

            # Compute how many standard deviations the slope represents
            slope_severity = abs(slope) / (sd / 24.0)  # sd per hour -> per day

            # Weight by sensor importance (vibration and temp are critical)
            weight = 2.0 if "vib" in sensor_key or "temp" in sensor_key else 1.0

            trend_severity += slope_severity * weight
            sensor_count += weight

        if sensor_count == 0:
            return 1.0

        # Average trend severity across sensors
        avg_severity = trend_severity / sensor_count

        # Convert severity to acceleration factor
        # Linear mapping: severity 0 -> factor 1.0, severity 2+ -> factor 1.5
        acceleration_factor = 1.0 + (avg_severity * 0.25)

        # Cap the factor to reasonable bounds
        return max(0.5, min(2.0, acceleration_factor))

    def _compute_trend_rul(self, measurement: str, latest_sensors: dict) -> dict:
        """Original trend-based RUL computation (fallback when no simulation)"""
        try:
            rows = self.query_recent_series(measurement, hours=6, limit=240)
        except Exception:
            rows = []

        if not rows:
            return {
                "equipment_rul_days": None,
                "equipment_days_to_action": None,
                "culprit_sensor": None,
                "per_sensor": []
            }

        # sensors we use for RUL (start with condition + electrical; you can expand later)
        keys = [
            "bearing_temp_c",
            "oil_temp_c",
            "vibration_velocity_mm_s",
            "vibration_velocity",
            "shaft_displacement_um",
            "accelerometer_g",
            "motor_current_a",
            "power_consumption_kw",
            "supply_voltage_v",
            "flow_rate_m3_h",
            "inlet_pressure_bar",
            "outlet_pressure_bar",
        ]

        # normalize velocity key
        def _get_val(row, k):
            if k in row:
                return _safe_float(row.get(k))
            return None

        # thresholds using z-score based limits (consistent with fault detection)
        def z_limits(key):
            mu = BASELINE_MEAN.get(key)
            sd = BASELINE_STD.get(key)
            if mu is None or sd is None or sd <= 0:
                return None
            return {
                "warn": mu + Z_WARN * sd,
                "fail": mu + Z_CRIT * sd,
                "direction": "high"
            }

        limits = {}

        # z-score based limits for mechanical sensors
        limits["bearing_temp_c"] = z_limits("bearing_temp_c")
        limits["oil_temp_c"] = z_limits("oil_temp_c")
        limits["shaft_displacement_um"] = z_limits("shaft_displacement_um")
        limits["accelerometer_g"] = z_limits("accelerometer_g")

        # vibration: map to same baseline
        vib_limits = z_limits("vibration_velocity_mm_s")
        if vib_limits:
            limits["vibration_velocity"] = vib_limits
            limits["vibration_velocity_mm_s"] = vib_limits

        # nominal-type (warn/fail around nominal) using your FAULT_RULES config
        # deviation-based thresholds:
        def dev_bounds(nom, warn_dev, fail_dev):
            # we treat high-side bound for RUL when trend is moving upward,
            # and low-side bound when moving downward (direction handled later)
            return {
                "nom": nom,
                "warn_hi": nom * (1 + warn_dev),
                "fail_hi": nom * (1 + fail_dev),
                "warn_lo": nom * (1 - warn_dev),
                "fail_lo": nom * (1 - fail_dev),
            }

        nom = FAULT_RULES["nominal"]
        limits["motor_current_a"] = {"type": "nom", **dev_bounds(nom["motor_current_a"]["nom"], nom["motor_current_a"]["warn_dev"], nom["motor_current_a"]["fail_dev"])}
        limits["power_consumption_kw"] = {"type": "nom", **dev_bounds(nom["power_consumption_kw"]["nom"], nom["power_consumption_kw"]["warn_dev"], nom["power_consumption_kw"]["fail_dev"])}
        limits["supply_voltage_v"] = {"type": "nom", **dev_bounds(nom["supply_voltage_v"]["nom"], nom["supply_voltage_v"]["warn_dev"], nom["supply_voltage_v"]["fail_dev"])}
        limits["flow_rate_m3_h"] = {"type": "nom", **dev_bounds(nom["flow_rate_m3_h"]["nom"], nom["flow_rate_m3_h"]["warn_dev"], nom["flow_rate_m3_h"]["fail_dev"])}
        limits["inlet_pressure_bar"] = {"type": "nom", **dev_bounds(nom["inlet_pressure_bar"]["nom"], nom["inlet_pressure_bar"]["warn_dev"], nom["inlet_pressure_bar"]["fail_dev"])}
        limits["outlet_pressure_bar"] = {"type": "nom", **dev_bounds(nom["outlet_pressure_bar"]["nom"], nom["outlet_pressure_bar"]["warn_dev"], nom["outlet_pressure_bar"]["fail_dev"])}

        per_sensor = []

        # build series + compute slope for each key
        for k in keys:
            series = []
            times = []
            for r in rows:
                v = _get_val(r, k)
                if v is None:
                    continue
                times.append(r["time"])
                series.append(v)

            if len(series) < 8:
                continue

            sm = _ewma(series, alpha=0.25)
            rate = _slope_per_day(times, sm)
            current = latest_sensors.get(k) if k in latest_sensors else (sm[-1] if sm else None)

            cfg = limits.get(k)
            if not cfg:
                continue

            # limit-type
            if cfg.get("type") != "nom":
                warn = cfg["warn"]
                fail = cfg["fail"]
                direction = cfg.get("direction", "high")

                days_fail = _rul_days_to_limit(current, rate, fail, direction)
                days_warn = _rul_days_to_limit(current, rate, warn, direction)

            else:
                # nominal-type: decide whether the trend is going up or down vs nominal
                nomv = cfg["nom"]
                # upward trend => compare to high bounds
                if rate > 0:
                    days_fail = _rul_days_to_limit(current, rate, cfg["fail_hi"], "high")
                    days_warn = _rul_days_to_limit(current, rate, cfg["warn_hi"], "high")
                # downward trend => compare to low bounds
                elif rate < 0:
                    days_fail = _rul_days_to_limit(current, rate, cfg["fail_lo"], "low")
                    days_warn = _rul_days_to_limit(current, rate, cfg["warn_lo"], "low")
                else:
                    days_fail = None
                    days_warn = None

            per_sensor.append({
                "sensor": k,
                "current": _safe_float(current),
                "rate_per_day": float(rate),
                "rul_days_to_fail": None if days_fail is None else float(days_fail),
                "days_to_action": None if days_warn is None else float(days_warn),
            })

        # equipment RUL = min positive days_to_fail (or 0 if already beyond)
        def _min_days(field):
            vals = []
            for r in per_sensor:
                v = r.get(field)
                if v is None:
                    continue
                vals.append(v)
            if not vals:
                return None
            return min(vals)

        equipment_rul = _min_days("rul_days_to_fail")
        equipment_action = _min_days("days_to_action")

        culprit = None
        if equipment_rul is not None:
            # choose sensor with same min
            for r in per_sensor:
                if r.get("rul_days_to_fail") == equipment_rul:
                    culprit = r["sensor"]
                    break

        return {
            "equipment_rul_days": equipment_rul,
            "equipment_days_to_action": equipment_action,
            "culprit_sensor": culprit,
            "per_sensor": per_sensor
        }

    def close(self):
        """Close client connection."""
        if self._client:
            self._client.close()
            self._client = None


class APIServer:
    """FastAPI server orchestrator."""
    
    def __init__(self, influx_config: InfluxDBConfig):
        self.app = FastAPI(title="ML GasOil Backend API")
        self.logger = LoggerConfig.setup_logger()
        self.influx_config = influx_config
        self.query_service = InfluxDBQueryService(influx_config, self.logger)
        self.csv_service: Optional[CSVGenerationService] = None
        self.chat_config = ChatConfig.from_env()
        self.chat_service = ChatService(self.chat_config, self.logger)
        
        self._setup_cors()
        self._setup_routes()
    
    def _setup_cors(self):
        """Configure CORS middleware."""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:3005"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def _setup_routes(self):
        """Configure API routes."""
        # Include auth routes
        self.app.include_router(auth_router)
        
        @self.app.get("/health")
        async def health_check():
            """Health check endpoint."""
            return {
                "status": "healthy",
                "timestamp": datetime.now().isoformat(),
                "csv_generation_running": self.csv_service.is_running() if self.csv_service else False
            }
        
        @self.app.post("/api/query/time-range")
        async def query_time_range(query: TimeRangeQuery):
            """Query data within time range."""
            try:
                results = self.query_service.query_time_range(
                    query.start, query.stop, query.measurement
                )
                return {"data": results, "count": len(results)}
            except Exception as e:
                self.logger.error(f"Time range query failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/query/latest")
        async def query_latest(query: LatestQuery):
            """Query latest records."""
            try:
                results = self.query_service.query_latest(query.measurement, query.limit)
                return {"data": results, "count": len(results)}
            except Exception as e:
                self.logger.error(f"Latest query failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/query/sensor-context")
        async def query_sensor_context(query: SensorContextQuery):
            """Query sensor statistics for chat context."""
            try:
                stats = self.query_service.query_sensor_context(query.minutes, query.measurement)
                return {"stats": stats, "minutes": query.minutes}
            except Exception as e:
                self.logger.error(f"Sensor context query failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/query/ml-status")
        async def query_ml_status(query: MLStatusQuery):
            """Query ML-driven health status and fault type."""
            try:
                results = self.query_service.query_ml_status(query.limit, query.measurement)
                return {"data": results, "count": len(results)}
            except Exception as e:
                self.logger.error(f"ML status query failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/debug/data-check")
        async def debug_data_check(measurement: str = "sensor_measurements"):
            """Debug endpoint to check what data exists in InfluxDB."""
            try:
                # Simple count query to see if there's any data
                count_query = f'''
                from(bucket: "{self.query_service.config.bucket}")
                    |> range(start: -30d)
                    |> filter(fn: (r) => r["_measurement"] == "{measurement}")
                    |> count()
                '''

                client = self.query_service._get_client()
                query_api = client.query_api()
                count_tables = query_api.query(count_query, org=self.query_service.config.org)

                total_count = 0
                for table in count_tables:
                    for record in table.records:
                        total_count += record.get_value()
                        break

                # Get latest timestamp
                time_query = f'''
                from(bucket: "{self.query_service.config.bucket}")
                    |> range(start: -30d)
                    |> filter(fn: (r) => r["_measurement"] == "{measurement}")
                    |> sort(columns: ["_time"], desc: true)
                    |> limit(n: 1)
                '''

                time_tables = query_api.query(time_query, org=self.query_service.config.org)
                latest_time = None
                for table in time_tables:
                    for record in table.records:
                        latest_time = record.get_time()
                        break

                # Get all measurements in the bucket
                measurement_query = f'''
                import "influxdata/influxdb/schema"
                schema.measurements(bucket: "{self.query_service.config.bucket}")
                '''

                measurement_tables = query_api.query(measurement_query, org=self.query_service.config.org)
                measurements = []
                for table in measurement_tables:
                    for record in table.records:
                        measurements.append(record.get_value())

                return {
                    "measurement_requested": measurement,
                    "total_records_last_30d": total_count,
                    "latest_timestamp": latest_time.isoformat() if latest_time else None,
                    "all_measurements_in_bucket": measurements,
                    "bucket": self.query_service.config.bucket,
                    "org": self.query_service.config.org
                }
            except Exception as e:
                self.logger.error(f"Debug data check failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.get("/api/overview/latest")
        async def get_overview_latest(measurement: str = "sensor_measurements", user=Depends(get_current_user)):
            """Get latest overview data including sensors, ML status, and fault type."""
            try:
                result = self.query_service.query_overview_latest(measurement)
                return result
            except Exception as e:
                self.logger.error(f"Overview latest query failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/csv/start")
        async def start_csv_generation(request: CSVGenerationRequest, user=Depends(get_current_user)):
            """Start CSV data generation."""
            try:
                if self.csv_service and self.csv_service.is_running():
                    raise HTTPException(status_code=400, detail="CSV generation already running")
                
                csv_config = CSVConfig(
                    path=request.csv_path,
                    measurement_name=request.measurement_name,
                    status_map={"Normal": 0, "Warning": 1, "Failure": 2, "Error": 2},
                    sleep_seconds=request.sleep_seconds,
                    loop_forever=request.loop_forever,
                    is_csv_status_enabled=request.is_csv_status_enabled
                )
                
                self.csv_service = CSVGenerationService(self.influx_config, csv_config)
                await self.csv_service.start()
                
                return {"status": "started", "message": "CSV generation started successfully"}
            except Exception as e:
                print("CSV START ERROR:", e)
                traceback.print_exc()
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/csv/stop")
        async def stop_csv_generation(user=Depends(get_current_user)):
            """Stop CSV data generation."""
            try:
                if not self.csv_service or not self.csv_service.is_running():
                    raise HTTPException(status_code=400, detail="CSV generation not running")
                
                await self.csv_service.stop()
                return {"status": "stopped", "message": "CSV generation stopped successfully"}
            except Exception as e:
                self.logger.error(f"Failed to stop CSV generation: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.get("/api/csv/status")
        async def get_csv_status(user=Depends(get_current_user)):
            """Get CSV generation status."""
            return {
                "running": self.csv_service.is_running() if self.csv_service else False,
                "timestamp": datetime.now().isoformat()
            }

        @self.app.get("/api/maintenance/data")
        async def get_maintenance_data(user=Depends(get_current_user)):
            """Get maintenance data from CSV file."""
            try:
                # Path to the CSV file - you may want to make this configurable
                csv_path = "datasets/datasets_renamed/TestForModel_Layer1.csv"

                if not os.path.exists(csv_path):
                    raise HTTPException(status_code=404, detail="CSV file not found")

                # Read CSV file
                df = pd.read_csv(csv_path)

                # Process the data into maintenance format
                maintenance_data = []
                for idx, row in df.iterrows():
                    # Calculate health score based on health_status and fault_type
                    health_status = row.get('health_status', 'Normal')
                    fault_type = row.get('fault_type', 'Normal')

                    # Calculate health score (0-100, where 100 is worst)
                    if health_status == 'Normal' and fault_type == 'Normal':
                        health_score = 15  # Good health
                    elif health_status == 'Warning':
                        health_score = 35  # Warning
                    elif health_status == 'Failure' or fault_type != 'Normal':
                        health_score = 85  # Critical
                    else:
                        health_score = 50  # Medium

                    # Determine risk level and priority
                    if health_score > 70:
                        risk_level = 'critical'
                        priority = 'High'
                    elif health_score > 30:
                        risk_level = 'medium'
                        priority = 'Medium'
                    else:
                        risk_level = 'low'
                        priority = 'Low'

                    # Calculate days to action based on health score
                    if health_score > 70:
                        days_to_action = 3  # Critical - immediate action
                    elif health_score > 30:
                        days_to_action = 14  # Medium - 2 weeks
                    else:
                        days_to_action = 60  # Low - 2 months

                    # Simulate trend based on health score variation
                    trend = 'stable'
                    if idx > 0:
                        prev_health = maintenance_data[-1]['health_score']
                        if health_score > prev_health + 10:
                            trend = 'down'  # Health deteriorating
                        elif health_score < prev_health - 10:
                            trend = 'up'  # Health improving

                    maintenance_item = {
                        "id": f"asset_{idx + 1}",
                        "name": f"Equipment Unit {idx + 1}",
                        "component": f"Component {chr(65 + (idx % 5))}",  # A, B, C, D, E cycle
                        "health_score": health_score,
                        "risk_level": risk_level,
                        "priority": priority,
                        "days_to_action": days_to_action,
                        "trend": trend,
                        "failure_modes": [fault_type] if fault_type != 'Normal' else ['Normal Operation'],
                        "downtime_impact": 'High' if health_score > 50 else 'Medium' if health_score > 25 else 'Low',
                        "action": 'Monitor' if health_score < 30 else 'Inspect' if health_score < 70 else 'Replace',
                        "days_to_action_logic": "threshold_crossing",
                        "timestamp": row.get('timestamp', datetime.now().isoformat())
                    }
                    maintenance_data.append(maintenance_item)

                return {
                    "data": maintenance_data,
                    "count": len(maintenance_data),
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                self.logger.error(f"Failed to load maintenance data: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.post("/api/maintenance/ai-refresh")
        async def maintenance_ai_refresh(req: MaintenanceAIRefreshRequest, user=Depends(get_current_user)):
            """
            Call GPT to generate maintenance table rows as STRUCTURED JSON.
            """
            try:
                # 1) Get context from Influx (same idea as chat)
                stats = self.query_service.query_sensor_context(req.minutes, req.measurement)
                ml_status = self.query_service.query_ml_status(5, req.measurement)

                # 2) Compute HI per component
                means = stats_to_mean_values(stats)
                component_hi = compute_component_hi(means, HI_CONFIG)

                # 3) Get equipment RUL (same as overview) for GPT context
                try:
                    overview_data = self.query_service.query_overview_latest(req.measurement)
                    equipment_rul = overview_data.get("rul", {}).get("equipment_rul_days", 120.0)
                except:
                    equipment_rul = 150.0  # fallback

                # 4) Build an asset list (each component is a different sensor type)
                # Map sensor keys to readable component names
                sensor_components = {
                    'accelerometer_g': 'Accelerometer',
                    'vibration_velocity_mm_s': 'Vibration Velocity',
                    'shaft_displacement_um': 'Shaft Displacement',
                    'bearing_temp_c': 'Bearing Temperature',
                    'oil_temp_c': 'Oil Temperature',
                    'casing_temp_c': 'Casing Temperature',
                    'inlet_fluid_temp_c': 'Inlet Fluid Temperature',
                    'outlet_fluid_temp_c': 'Outlet Fluid Temperature',
                    'inlet_pressure_bar': 'Inlet Pressure',
                    'outlet_pressure_bar': 'Outlet Pressure',
                    'flow_rate_m3_h': 'Flow Rate',
                    'motor_current_a': 'Motor Current',
                    'supply_voltage_v': 'Supply Voltage',
                    'power_consumption_kw': 'Power Consumption',
                    'sound_intensity_db': 'Sound Intensity'
                }
                sensor_keys = list(stats.keys())

                # Fallback sensor keys if stats is empty
                if not sensor_keys:
                    sensor_keys = ['vibration_velocity_mm_s', 'bearing_temp_c', 'motor_current_a', 'flow_rate_m3_h']

                # Fixed assets_input structure with 10 components
                assets_input = [
                    {"component": "Casing",
                     "sensor_keys": ["accelerometer_g","vibration_velocity_mm_s","sound_intensity_db","outlet_pressure_bar","outlet_fluid_temp_c"]},

                    {"component": "Bearing",
                     "sensor_keys": ["accelerometer_g","vibration_velocity_mm_s","shaft_displacement_um","bearing_temp_c","oil_temp_c","sound_intensity_db","power_consumption_kw"]},

                    {"component": "Pump Shaft",
                     "sensor_keys": ["shaft_displacement_um","vibration_velocity_mm_s","sound_intensity_db","power_consumption_kw"]},

                    {"component": "Lubrication System",
                     "sensor_keys": ["oil_temp_c","bearing_temp_c","sound_intensity_db","power_consumption_kw"]},

                    {"component": "Motor",
                     "sensor_keys": ["motor_current_a","supply_voltage_v","power_consumption_kw","sound_intensity_db"]},

                    {"component": "Impeller",
                     "sensor_keys": ["accelerometer_g","vibration_velocity_mm_s","flow_rate_m3_h","outlet_pressure_bar","sound_intensity_db"]},

                    {"component": "Mechanical Seal",
                     "sensor_keys": ["bearing_temp_c","oil_temp_c","sound_intensity_db","inlet_pressure_bar"]},

                    {"component": "Suction Pipe Side",
                     "sensor_keys": ["inlet_pressure_bar","flow_rate_m3_h","inlet_fluid_temp_c","sound_intensity_db"]},

                    {"component": "Discharge Pipe Side",
                     "sensor_keys": ["outlet_pressure_bar","flow_rate_m3_h","outlet_fluid_temp_c","sound_intensity_db"]},

                    {"component": "Coupling / Alignment",
                     "sensor_keys": ["shaft_displacement_um","vibration_velocity_mm_s","sound_intensity_db","power_consumption_kw"]},
                ]

                # 6) attach HI into assets_input (for GPT context only)
                for a in assets_input:
                    component_name = a["component"]
                    a["hi"] = component_hi.get(component_name)

                # 7) Ask GPT for structured maintenance table
                result = self.chat_service.generate_maintenance_table(
                    sensor_stats=stats,
                    ml_status=ml_status,
                    assets_input=assets_input,
                    overall_equipment_rul=equipment_rul
                )

                return result

            except Exception as e:
                self.logger.error(f"maintenance_ai_refresh failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))
        
        @self.app.post("/api/chat/send")
        async def send_chat_message(request: ChatMessageRequest, user=Depends(get_current_user)):
            """Send chat message with context."""
            try:
                response = self.chat_service.send_message(
                    request.message,
                    request.sensor_context,
                    request.ml_status_context
                )
                return {"response": response}
            except Exception as e:
                self.logger.error(f"Chat message failed: {e}")
                raise HTTPException(status_code=500, detail=str(e))

        @self.app.on_event("shutdown")
        async def shutdown_event():
            """Cleanup on shutdown."""
            if self.csv_service and self.csv_service.is_running():
                await self.csv_service.stop()
            self.query_service.close()


def create_app() -> FastAPI:
    """Factory function to create FastAPI app."""
    influx_config = InfluxDBConfig.from_env()
    print(influx_config)
    server = APIServer(influx_config)
    return server.app

