import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/entity-components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          {siteConfig.title}
        </Heading>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
        
        {/* Demo Video Placeholder */}
        <div className={styles.demoVideoPlaceholder}>
          <div style={{
            width: '100%',
            maxWidth: '800px',
            margin: '2rem auto',
            backgroundColor: '#2e2e2e',
            borderRadius: '12px',
            padding: '20px',
            border: '2px dashed #666'
          }}>
            <div style={{
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              color: '#999'
            }}>
              <svg width="80" height="80" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
              <p style={{marginTop: '1rem', fontSize: '1.2rem'}}>
                Demo Video: 2-minute showcase
              </p>
              <p style={{fontSize: '0.9rem', marginTop: '0.5rem'}}>
                Shows user creating a rotating 3D object, adding physics, and making it interactive
              </p>
              <p style={{fontSize: '0.8rem', marginTop: '0.5rem', fontStyle: 'italic'}}>
                Features real-time editing, multiplayer sync, and script integration
              </p>
            </div>
          </div>
        </div>

        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/quick-start">
            Get Started in 5 Minutes ⚡
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs/tutorials/hello-vr-world"
            style={{marginLeft: '1rem'}}>
            View Tutorials 📚
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`${siteConfig.title} - Create VR Experiences in Real-Time`}
      description="Build, edit, and script VR experiences directly in your browser with the Wraptor Inspector. No Unity Editor required.">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
        
        {/* Quick Examples Section */}
        <section className={styles.examples}>
          <div className="container">
            <h2>What Can You Build?</h2>
            <div className={styles.exampleGrid}>
              <div className={styles.exampleCard}>
                <div className={styles.examplePlaceholder}>
                  <div style={{
                    height: '200px',
                    backgroundColor: '#333',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed #666'
                  }}>
                    <div style={{textAlign: 'center', color: '#999'}}>
                      <p>🎮</p>
                      <p>Interactive Games</p>
                      <small>Screenshot: Flappy Bird VR</small>
                    </div>
                  </div>
                </div>
                <h3>Games & Puzzles</h3>
                <p>Create interactive games with physics, scoring, and multiplayer support</p>
              </div>
              
              <div className={styles.exampleCard}>
                <div className={styles.examplePlaceholder}>
                  <div style={{
                    height: '200px',
                    backgroundColor: '#333',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed #666'
                  }}>
                    <div style={{textAlign: 'center', color: '#999'}}>
                      <p>🏛️</p>
                      <p>Virtual Spaces</p>
                      <small>Screenshot: Art Gallery</small>
                    </div>
                  </div>
                </div>
                <h3>Virtual Environments</h3>
                <p>Design immersive spaces for meetings, events, or social gatherings</p>
              </div>
              
              <div className={styles.exampleCard}>
                <div className={styles.examplePlaceholder}>
                  <div style={{
                    height: '200px',
                    backgroundColor: '#333',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px dashed #666'
                  }}>
                    <div style={{textAlign: 'center', color: '#999'}}>
                      <p>🎨</p>
                      <p>Interactive Art</p>
                      <small>Screenshot: Particle System</small>
                    </div>
                  </div>
                </div>
                <h3>Interactive Art</h3>
                <p>Build dynamic installations that respond to user interaction</p>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className={styles.cta}>
          <div className="container">
            <h2>Ready to Start Creating?</h2>
            <p>Join thousands of creators building the next generation of VR experiences</p>
            <div className={styles.buttons}>
              <Link
                className="button button--primary button--lg"
                to="/docs/quick-start">
                Start Building Now
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
