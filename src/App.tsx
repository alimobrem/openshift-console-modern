import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CompassLayout from './components/CompassLayout';

// Home
import Overview from './pages/home/Overview';
import Search from './pages/home/Search';
import Events from './pages/home/Events';

// Operators
import OperatorHub from './pages/operators/OperatorHub';
import InstalledOperators from './pages/operators/InstalledOperators';

// Workloads
import Pods from './pages/workloads/Pods';
import PodDetail from './pages/workloads/PodDetail';
import Deployments from './pages/workloads/Deployments';
import DeploymentDetail from './pages/workloads/DeploymentDetail';
import StatefulSets from './pages/workloads/StatefulSets';
import DaemonSets from './pages/workloads/DaemonSets';
import Jobs from './pages/workloads/Jobs';
import CronJobs from './pages/workloads/CronJobs';
import Secrets from './pages/workloads/Secrets';
import ConfigMaps from './pages/workloads/ConfigMaps';

// Networking
import Services from './pages/networking/Services';
import RoutesPage from './pages/networking/Routes';
import Ingress from './pages/networking/Ingress';
import NetworkPolicies from './pages/networking/NetworkPolicies';

// Storage
import PersistentVolumes from './pages/storage/PersistentVolumes';
import PersistentVolumeClaims from './pages/storage/PersistentVolumeClaims';
import StorageClasses from './pages/storage/StorageClasses';

// Builds
import Builds from './pages/builds/Builds';
import BuildConfigs from './pages/builds/BuildConfigs';
import ImageStreams from './pages/builds/ImageStreams';

// Observe
import Dashboards from './pages/observe/Dashboards';
import Metrics from './pages/observe/Metrics';
import Alerts from './pages/observe/Alerts';

// Compute
import Nodes from './pages/compute/Nodes';
import NodeDetail from './pages/workloads/NodeDetail';
import Machines from './pages/compute/Machines';

// Administration
import ClusterSettings from './pages/administration/ClusterSettings';
import Namespaces from './pages/administration/Namespaces';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CompassLayout />}>
          <Route index element={<Navigate to="/home/overview" replace />} />

          {/* Home */}
          <Route path="home">
            <Route path="overview" element={<Overview />} />
            <Route path="search" element={<Search />} />
            <Route path="events" element={<Events />} />
          </Route>

          {/* Operators */}
          <Route path="operators">
            <Route path="operatorhub" element={<OperatorHub />} />
            <Route path="installed" element={<InstalledOperators />} />
          </Route>

          {/* Workloads */}
          <Route path="workloads">
            <Route path="pods" element={<Pods />} />
            <Route path="pods/:namespace/:name" element={<PodDetail />} />
            <Route path="deployments" element={<Deployments />} />
            <Route path="deployments/:namespace/:name" element={<DeploymentDetail />} />
            <Route path="statefulsets" element={<StatefulSets />} />
            <Route path="daemonsets" element={<DaemonSets />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="cronjobs" element={<CronJobs />} />
            <Route path="secrets" element={<Secrets />} />
            <Route path="configmaps" element={<ConfigMaps />} />
          </Route>

          {/* Networking */}
          <Route path="networking">
            <Route path="services" element={<Services />} />
            <Route path="routes" element={<RoutesPage />} />
            <Route path="ingress" element={<Ingress />} />
            <Route path="networkpolicies" element={<NetworkPolicies />} />
          </Route>

          {/* Storage */}
          <Route path="storage">
            <Route path="persistentvolumes" element={<PersistentVolumes />} />
            <Route path="persistentvolumeclaims" element={<PersistentVolumeClaims />} />
            <Route path="storageclasses" element={<StorageClasses />} />
          </Route>

          {/* Builds */}
          <Route path="builds">
            <Route path="builds" element={<Builds />} />
            <Route path="buildconfigs" element={<BuildConfigs />} />
            <Route path="imagestreams" element={<ImageStreams />} />
          </Route>

          {/* Observe */}
          <Route path="observe">
            <Route path="dashboards" element={<Dashboards />} />
            <Route path="metrics" element={<Metrics />} />
            <Route path="alerts" element={<Alerts />} />
          </Route>

          {/* Compute */}
          <Route path="compute">
            <Route path="nodes" element={<Nodes />} />
            <Route path="nodes/:name" element={<NodeDetail />} />
            <Route path="machines" element={<Machines />} />
          </Route>

          {/* Administration */}
          <Route path="administration">
            <Route path="cluster-settings" element={<ClusterSettings />} />
            <Route path="namespaces" element={<Namespaces />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
