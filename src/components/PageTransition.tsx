import React from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = React.useState(children);
  const [transitionStage, setTransitionStage] = React.useState('enter');

  React.useEffect(() => {
    setTransitionStage('exit');
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setTransitionStage('enter');
    }, 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className={`compass-page-transition compass-page-transition--${transitionStage}`}>
      {displayChildren}
    </div>
  );
}
