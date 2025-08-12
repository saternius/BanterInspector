import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Live Scene Editing',
    icon: '🎨',
    description: (
      <>
        Edit your VR scenes in real-time with instant feedback. Add objects, 
        modify properties, and see changes immediately in your VR headset.
      </>
    ),
  },
  {
    title: 'Runtime Scripting',
    icon: '⚡',
    description: (
      <>
        Write JavaScript behaviors that run directly in Unity. Full lifecycle 
        support with onStart, onUpdate, and event handlers.
      </>
    ),
  },
  {
    title: 'Multiplayer Collaboration',
    icon: '👥',
    description: (
      <>
        Work together in real-time. Changes sync automatically across all 
        connected users with built-in conflict resolution.
      </>
    ),
  },
  {
    title: 'No Unity Editor Required',
    icon: '🚀',
    description: (
      <>
        Build complete VR experiences directly in your browser. No need to 
        install Unity or learn complex development tools.
      </>
    ),
  },
  {
    title: 'Component Library',
    icon: '🧩',
    description: (
      <>
        Over 40 pre-built Unity components including meshes, physics, audio, 
        video, portals, and VR-specific interactions.
      </>
    ),
  },
  {
    title: 'Persistent Inventory',
    icon: '📦',
    description: (
      <>
        Save and reuse GameObjects and scripts across projects. Export and 
        share your creations with the community.
      </>
    ),
  },
];

function Feature({title, icon, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <div className={styles.featureIcon} style={{fontSize: '3rem', marginBottom: '1rem'}}>
          {icon}
        </div>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <h2 className="text--center" style={{marginBottom: '2rem'}}>Key Features</h2>
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}