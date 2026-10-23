import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { AppLayout, AppLayoutFooterLink, Spinner } from 'erxes-ui';
import { IconArrowLeft, IconSettings } from '@tabler/icons-react';
import { PluginSettingsRoutes, PluginSharedSettingsNavigation } from 'ui-modules';
import { StudyAssistantNavigation } from './StudyAssistantNavigation';
import { StudyAssistantSettingsNavigation } from './StudyAssistantSettingsNavigation';

const Settings = lazy(() =>
  import('./StudyAssistantSettings').then((module) => ({
    default: module.StudyAssistantSettings,
  })),
);

const IndexPage = lazy(() =>
  import('~/pages/problems/IndexPage').then((module) => ({
    default: module.IndexPage,
  })),
);

export const StudyAssistantMain = () => {
  return (
    <Routes>
      <Route path="settings/*" element={
        <AppLayout
          id="study-assistant:settings"
          title="StudyAssistant Settings"
          sidebar={<>
            <StudyAssistantSettingsNavigation />
            <PluginSharedSettingsNavigation pluginName="study-assistant" pathPrefix="study-assistant/settings" />
          </>}
          footer={<AppLayoutFooterLink path="study-assistant/problems" name="Back to StudyAssistant" icon={IconArrowLeft} />}
        >
          <Suspense fallback={<Spinner />}>
            <PluginSettingsRoutes pluginName="study-assistant" basePath="/study-assistant/settings">
              <Routes>
                <Route index element={<Navigate to="problems" replace />} />
                <Route path="problems" element={<Settings />} />
              </Routes>
            </PluginSettingsRoutes>
          </Suspense>
        </AppLayout>
      } />
      <Route path="*" element={
        <AppLayout
          id="study-assistant"
          title="StudyAssistant"
          sidebar={<StudyAssistantNavigation />}
          footer={<AppLayoutFooterLink path="study-assistant/settings" name="App settings" icon={IconSettings} />}
        >
          <Suspense fallback={<Spinner />}>
            <Routes>
              <Route index element={<Navigate to="problems" replace />} />
              <Route path="problems" element={<IndexPage />} />
            </Routes>
          </Suspense>
        </AppLayout>
      } />
    </Routes>
  );
};
