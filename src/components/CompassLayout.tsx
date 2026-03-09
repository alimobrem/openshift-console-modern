import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Page,
  Masthead,
  MastheadToggle,
  MastheadMain,
  MastheadBrand,
  MastheadContent,
  PageSidebar,
  PageSidebarBody,
  Nav,
  NavList,
  NavItem,
  NavExpandable,
  PageToggleButton,
  Button,
  Avatar,
} from '@patternfly/react-core';
import {
  BarsIcon,
  BellIcon,
  CogIcon,
  SearchIcon,
  MoonIcon,
  SunIcon,
} from '@patternfly/react-icons';
import type { ThemeName } from './ThemePicker';
import ThemePicker from './ThemePicker';

const navigation = [
  {
    id: 'home',
    name: 'Home',
    children: [
      { id: 'overview', name: 'Overview', href: '/home/overview' },
      { id: 'search', name: 'Search', href: '/home/search' },
      { id: 'events', name: 'Events', href: '/home/events' },
    ],
  },
  {
    id: 'operators',
    name: 'Operators',
    children: [
      { id: 'operatorhub', name: 'OperatorHub', href: '/operators/operatorhub' },
      { id: 'installed-operators', name: 'Installed Operators', href: '/operators/installed' },
    ],
  },
  {
    id: 'workloads',
    name: 'Workloads',
    children: [
      { id: 'pods', name: 'Pods', href: '/workloads/pods' },
      { id: 'deployments', name: 'Deployments', href: '/workloads/deployments' },
      { id: 'statefulsets', name: 'StatefulSets', href: '/workloads/statefulsets' },
      { id: 'daemonsets', name: 'DaemonSets', href: '/workloads/daemonsets' },
      { id: 'jobs', name: 'Jobs', href: '/workloads/jobs' },
      { id: 'cronjobs', name: 'CronJobs', href: '/workloads/cronjobs' },
      { id: 'secrets', name: 'Secrets', href: '/workloads/secrets' },
      { id: 'configmaps', name: 'ConfigMaps', href: '/workloads/configmaps' },
    ],
  },
  {
    id: 'networking',
    name: 'Networking',
    children: [
      { id: 'services', name: 'Services', href: '/networking/services' },
      { id: 'routes', name: 'Routes', href: '/networking/routes' },
      { id: 'ingress', name: 'Ingress', href: '/networking/ingress' },
      { id: 'networkpolicies', name: 'Network Policies', href: '/networking/networkpolicies' },
    ],
  },
  {
    id: 'storage',
    name: 'Storage',
    children: [
      { id: 'persistentvolumes', name: 'Persistent Volumes', href: '/storage/persistentvolumes' },
      { id: 'persistentvolumeclaims', name: 'Persistent Volume Claims', href: '/storage/persistentvolumeclaims' },
      { id: 'storageclasses', name: 'Storage Classes', href: '/storage/storageclasses' },
    ],
  },
  {
    id: 'builds',
    name: 'Builds',
    children: [
      { id: 'builds', name: 'Builds', href: '/builds/builds' },
      { id: 'buildconfigs', name: 'Build Configs', href: '/builds/buildconfigs' },
      { id: 'imagestreams', name: 'Image Streams', href: '/builds/imagestreams' },
    ],
  },
  {
    id: 'observe',
    name: 'Observe',
    children: [
      { id: 'dashboards', name: 'Dashboards', href: '/observe/dashboards' },
      { id: 'metrics', name: 'Metrics', href: '/observe/metrics' },
      { id: 'alerts', name: 'Alerts', href: '/observe/alerts' },
    ],
  },
  {
    id: 'compute',
    name: 'Compute',
    children: [
      { id: 'nodes', name: 'Nodes', href: '/compute/nodes' },
      { id: 'machines', name: 'Machines', href: '/compute/machines' },
    ],
  },
  {
    id: 'administration',
    name: 'Administration',
    children: [
      { id: 'cluster-settings', name: 'Cluster Settings', href: '/administration/cluster-settings' },
      { id: 'namespaces', name: 'Namespaces', href: '/administration/namespaces' },
    ],
  },
];

export default function CompassLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [currentTheme, setCurrentTheme] = React.useState<ThemeName>(() => {
    // Check localStorage for saved theme
    const saved = localStorage.getItem('theme') as ThemeName;
    return saved || 'sunset';
  });

  React.useEffect(() => {
    // Auto-expand the section that contains the current route
    const currentSection = navigation.find((section) =>
      section.children?.some((child) => location.pathname.startsWith(child.href))
    );
    if (currentSection && !expandedItems.includes(currentSection.id)) {
      setExpandedItems([...expandedItems, currentSection.id]);
    }
  }, [location.pathname]);

  React.useEffect(() => {
    // Apply dark mode class to document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Save preference
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  React.useEffect(() => {
    // Apply theme class to document
    document.documentElement.setAttribute('data-theme', currentTheme);
    // Save preference
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleThemeChange = (theme: ThemeName) => {
    setCurrentTheme(theme);
  };

  const onNavSelect = (
    _event: React.FormEvent<HTMLInputElement>,
    result: { itemId: string | number }
  ) => {
    const itemId = result.itemId.toString();

    // Find the nav item in the navigation structure
    for (const section of navigation) {
      const child = section.children?.find((item) => item.id === itemId);
      if (child) {
        navigate(child.href);
        return;
      }
    }
  };

  const onToggle = (groupId: string) => {
    setExpandedItems((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const isItemActive = (href: string) => {
    return location.pathname.startsWith(href);
  };

  const Header = (
    <Masthead>
      <MastheadToggle>
        <PageToggleButton
          variant="plain"
          aria-label="Global navigation"
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        >
          <BarsIcon />
        </PageToggleButton>
      </MastheadToggle>
      <MastheadMain>
        <MastheadBrand>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                background: '#0066CC',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              O
            </div>
            <span style={{ fontWeight: 600, fontSize: '16px' }}>
              OpenShift Console
            </span>
          </div>
        </MastheadBrand>
      </MastheadMain>
      <MastheadContent>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <Button
            aria-label="Search"
            variant="plain"
            icon={<SearchIcon />}
          />
          <Button
            aria-label="Notifications"
            variant="plain"
            icon={<BellIcon />}
          />
          <ThemePicker currentTheme={currentTheme} onThemeChange={handleThemeChange} />
          <Button
            aria-label="Toggle dark mode"
            variant="plain"
            icon={isDarkMode ? <SunIcon /> : <MoonIcon />}
            onClick={toggleDarkMode}
          />
          <Button
            aria-label="Settings"
            variant="plain"
            icon={<CogIcon />}
          />
          <Avatar alt="" style={{ marginLeft: '8px' }} />
        </span>
      </MastheadContent>
    </Masthead>
  );

  const Sidebar = (
    <PageSidebar isSidebarOpen={isSidebarOpen}>
      <PageSidebarBody>
        <Nav onSelect={onNavSelect} aria-label="Global navigation">
          <NavList>
            {navigation.map((section) => (
              <NavExpandable
                key={section.id}
                title={section.name}
                groupId={section.id}
                isExpanded={expandedItems.includes(section.id)}
                onExpand={() => onToggle(section.id)}
              >
                {section.children?.map((item) => (
                  <NavItem
                    key={item.id}
                    itemId={item.id}
                    isActive={isItemActive(item.href)}
                  >
                    {item.name}
                  </NavItem>
                ))}
              </NavExpandable>
            ))}
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );

  return (
    <Page masthead={Header} sidebar={Sidebar} isManagedSidebar>
      <Outlet />
    </Page>
  );
}
