import { CloudClientContext } from 'context/app-context';
import * as React from 'react';
import { operation } from 'retry';
import { isDev } from 'utils/env';

import { VizierGRPCClient, CloudClient, GQLClusterStatus as ClusterStatus } from '@pixie/api';

export interface VizierGRPCClientContextProps {
  client: VizierGRPCClient | null;
  healthy: boolean;
  loading: boolean;
  clusterStatus: ClusterStatus;
}

export const VizierGRPCClientContext = React.createContext<VizierGRPCClientContextProps>(null);

interface Props {
  passthroughEnabled: boolean;
  children: React.ReactNode;
  clusterID: string;
  clusterStatus: ClusterStatus;
}

async function newVizierClient(
  cloudClient: CloudClient, clusterID: string, passthroughEnabled: boolean,
) {
  const { ipAddress, token } = await cloudClient.getClusterConnection(clusterID, true);
  let address = ipAddress;
  if (passthroughEnabled) {
    // If cloud is running in dev mode, automatically direct to Envoy's port, since there is
    // no GCLB to redirect for us in dev.
    address = window.location.origin + (isDev() ? ':4444' : '');
  }
  return new VizierGRPCClient(address, token, clusterID, passthroughEnabled);
}

export const VizierGRPCClientProvider = (props: Props) => {
  const {
    children, passthroughEnabled, clusterID, clusterStatus,
  } = props;
  const cloudClient = React.useContext(CloudClientContext);
  const [client, setClient] = React.useState<VizierGRPCClient>(null);
  const [loading, setLoading] = React.useState(true);

  const healthy = client && clusterStatus === ClusterStatus.CS_HEALTHY;

  React.useEffect(() => {
    // Everytime the clusterID changes, we enter a loading state until we
    // receive a healthy status.
    setLoading(true);
  }, [clusterID]);

  React.useEffect(() => {
    let currentSubscription = null;
    let subscriptionPromise = Promise.resolve();
    const retryOp = operation({ forever: true, randomize: true });
    // TODO might need to remove this.
    if (clusterStatus !== ClusterStatus.CS_HEALTHY) {
      retryOp.stop();
      if (currentSubscription) {
        currentSubscription.unsubscribe();
        currentSubscription = null;
      }
    } else {
      // Cluster is healthy
      retryOp.reset();
      retryOp.attempt(() => {
        if (currentSubscription) {
          currentSubscription.unsubscribe();
        }
        setClient(null);
        subscriptionPromise = newVizierClient(cloudClient, clusterID, passthroughEnabled).then(
          (newClient) => {
            currentSubscription = newClient.health().subscribe({
              next: (status) => {
                retryOp.reset();
                if (status.getCode() === 0) {
                  setClient(newClient);
                  setLoading(false);
                } else {
                  setClient(null);
                }
              },
              complete: () => {
                retryOp.retry(new Error('stream ended'));
              },
              error: (error) => {
                setClient(null);
                retryOp.retry(error);
              },
            });
          },
        );
      });
    }
    return () => {
      subscriptionPromise.then(() => {
        if (currentSubscription) {
          currentSubscription.unsubscribe();
        }
      });
      retryOp.stop();
    };
  }, [clusterID, passthroughEnabled, clusterStatus, cloudClient]);

  const context = React.useMemo(() => ({
    client,
    healthy,
    loading,
    clusterStatus,
  }), [client, healthy, loading, clusterStatus]);

  return (
    <VizierGRPCClientContext.Provider value={context}>
      {children}
    </VizierGRPCClientContext.Provider>
  );
};

export default VizierGRPCClientContext;
