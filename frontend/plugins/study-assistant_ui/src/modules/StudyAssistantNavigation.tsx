
  import { NavigationMenuLinkItem, Sidebar } from 'erxes-ui';
  import { IconSandbox } from '@tabler/icons-react';

export const StudyAssistantNavigation = () => {
  return (
    <Sidebar.Group>
      <Sidebar.GroupContent>
        <Sidebar.Menu>
          <NavigationMenuLinkItem
            name="problems"
            icon={IconSandbox}
            pathPrefix="study-assistant"
            path="problems"
          />
        </Sidebar.Menu>
      </Sidebar.GroupContent>
    </Sidebar.Group>
  );
};
