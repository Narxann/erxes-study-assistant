
import { IconSandbox } from '@tabler/icons-react';
import { IUIConfig } from 'erxes-ui';

export const CONFIG: IUIConfig = {
  name: 'study-assistant',
  path: 'study-assistant',
  icon: IconSandbox,
  navigationGroup: {
    name: 'study-assistant',
    defaultPath: 'study-assistant/problems',
    icon: IconSandbox,
  },

  modules: [
    {
      name: 'problems',
      icon: IconSandbox,
      path: 'study-assistant/problems',
    },
  ],
};
