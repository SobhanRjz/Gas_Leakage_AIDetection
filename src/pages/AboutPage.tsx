import React from 'react'
import { ThemeContext } from '../components/Header'
import './AboutPage.css'

/**
 * About page for pipeline monitoring system
 */
const AboutPage: React.FC = () => {
  const { isDarkTheme } = React.useContext(ThemeContext)

  return (
    <div className={`about-page ${isDarkTheme ? 'theme-dark' : 'theme-light'}`}>
      <div className="about-container">
        {/* Hero Section */}
        <section className="about-hero">
          <h1 className="hero-title">AI-Powered Pipeline Monitoring System</h1>
          <p className="hero-description">
            Advanced deep learning technology for real-time gas pipeline leak detection, 
            defect analysis, and predictive maintenance in the oil and gas industry.
          </p>
        </section>

        {/* Mission Section */}
        <section className="mission-section">
          <div className="section-content">
            <h2 className="section-title">Our Mission</h2>
            <p className="section-text">
              To protect infrastructure, environment, and communities by leveraging cutting-edge 
              artificial intelligence for early detection and prevention of pipeline failures. 
              We combine drone surveillance, IoT sensors, and deep learning to create the most 
              comprehensive pipeline monitoring solution available.
            </p>
          </div>
        </section>

        {/* Features Grid */}
        <section className="features-section">
          <h2 className="section-title-center">Key Capabilities</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🤖</div>
              <h3 className="feature-title">AI Deep Learning</h3>
              <p className="feature-description">
                Advanced neural networks trained on thousands of pipeline images detect leaks, 
                corrosion, and structural defects with 98.5% accuracy.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🚁</div>
              <h3 className="feature-title">Drone Surveillance</h3>
              <p className="feature-description">
                Autonomous drone patrols equipped with thermal, visible, and spectroscopic cameras 
                for comprehensive aerial monitoring.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3 className="feature-title">Real-Time Analytics</h3>
              <p className="feature-description">
                Live monitoring dashboard with instant alerts, predictive analytics, and 
                actionable insights for rapid response.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3 className="feature-title">Multi-Sensor Integration</h3>
              <p className="feature-description">
                Integration of pressure transmitters, flow meters, and IoT sensors for 
                comprehensive control system data analysis.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Instant Detection</h3>
              <p className="feature-description">
                Immediate identification of sudden leaks, gas clouds, thermal anomalies, 
                and pressure drops with automated alert dispatch.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📈</div>
              <h3 className="feature-title">Predictive Maintenance</h3>
              <p className="feature-description">
                Machine learning models predict potential failure points before they occur, 
                enabling proactive maintenance scheduling.
              </p>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="tech-section">
          <h2 className="section-title-center">Technology Stack</h2>
          <div className="tech-grid">
            <div className="tech-category">
              <h3 className="tech-category-title">AI & Machine Learning</h3>
              <div className="tech-tags">
                <span className="tech-tag">TensorFlow</span>
                <span className="tech-tag">PyTorch</span>
                <span className="tech-tag">OpenCV</span>
                <span className="tech-tag">YOLO</span>
                <span className="tech-tag">CNN</span>
              </div>
            </div>

            <div className="tech-category">
              <h3 className="tech-category-title">Data Processing</h3>
              <div className="tech-tags">
                <span className="tech-tag">Python</span>
                <span className="tech-tag">NumPy</span>
                <span className="tech-tag">Pandas</span>
                <span className="tech-tag">Apache Kafka</span>
              </div>
            </div>

            <div className="tech-category">
              <h3 className="tech-category-title">Frontend</h3>
              <div className="tech-tags">
                <span className="tech-tag">React</span>
                <span className="tech-tag">TypeScript</span>
                <span className="tech-tag">Vite</span>
                <span className="tech-tag">CSS3</span>
              </div>
            </div>

            <div className="tech-category">
              <h3 className="tech-category-title">Infrastructure</h3>
              <div className="tech-tags">
                <span className="tech-tag">IoT Sensors</span>
                <span className="tech-tag">Edge Computing</span>
                <span className="tech-tag">Cloud Storage</span>
                <span className="tech-tag">Real-time DB</span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-value">98.5%</div>
              <div className="stat-label">AI Accuracy</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">24/7</div>
              <div className="stat-label">Monitoring</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">&lt;5min</div>
              <div className="stat-label">Response Time</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">2,450km</div>
              <div className="stat-label">Coverage</div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="benefits-section">
          <h2 className="section-title-center">Why Choose Our System</h2>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-number">01</div>
              <h3 className="benefit-title">Safety First</h3>
              <p className="benefit-text">
                Protect workers, communities, and the environment through early leak detection 
                and rapid response capabilities.
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-number">02</div>
              <h3 className="benefit-title">Cost Reduction</h3>
              <p className="benefit-text">
                Reduce operational costs by preventing major failures, optimizing maintenance 
                schedules, and minimizing downtime.
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-number">03</div>
              <h3 className="benefit-title">Regulatory Compliance</h3>
              <p className="benefit-text">
                Meet and exceed industry safety standards with comprehensive monitoring and 
                detailed audit trails.
              </p>
            </div>

            <div className="benefit-item">
              <div className="benefit-number">04</div>
              <h3 className="benefit-title">Environmental Protection</h3>
              <p className="benefit-text">
                Minimize environmental impact through rapid leak detection and containment, 
                reducing greenhouse gas emissions.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="contact-section">
          <div className="contact-content">
            <h2 className="contact-title">Get in Touch</h2>
            <p className="contact-description">
              Interested in implementing our pipeline monitoring system? Contact us for a 
              demonstration and consultation.
            </p>
            <div className="contact-info">
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <span className="contact-text">info@pipelinemonitor.com</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default AboutPage

