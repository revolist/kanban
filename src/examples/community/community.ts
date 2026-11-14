import { defineCustomElements } from '@revolist/revogrid/loader';
import { currentTheme, observeCurrentTheme } from '../../theme';
import { createCommunitySession, communityLanguage, type CommunityCard } from './community.shared';
void defineCustomElements();
export function load(parentSelector: string, rows?: CommunityCard[]) {
  const parent = document.querySelector(parentSelector);
  if (!parent) {
    return;
  }
  const session = createCommunitySession(rows, communityLanguage());
  const section = document.createElement('section');
  section.className = 'community-demo rv-native-controls';
  section.dataset.theme = 'auto';
  const header = document.createElement('header');
  const summary = document.createElement('div');
  const title = document.createElement('h1');
  title.textContent = session.labels.title;
  const description = document.createElement('p');
  description.textContent = session.labels.intro;
  summary.append(title, description);
  const actions = document.createElement('div');
  actions.className = 'community-demo__actions';
  const save = document.createElement('button');
  save.className = 'rv-btn-solid';
  save.textContent = session.labels.save;
  const reload = document.createElement('button');
  reload.className = 'rv-btn-ghost';
  reload.textContent = session.labels.load;
  const status = document.createElement('p');
  status.className = 'community-demo__status';
  status.setAttribute('role', 'status');
  status.textContent = session.labels.initial;
  const grid = document.createElement('revo-grid');
  grid.className = 'community-demo__grid';
  grid.plugins = session.plugins;
  grid.kanban = session.config;
  grid.kanbanToolbar = session.toolbar;
  grid.theme = currentTheme().isDark() ? 'darkCompact' : 'compact';
  save.onclick = async () => {
    status.textContent = (await session.save(grid)) ?? status.textContent;
  };
  reload.onclick = () => {
    status.textContent = session.load(grid) ?? status.textContent;
  };
  actions.append(save, reload);
  header.append(summary, actions);
  section.append(header, status, grid);
  parent.append(section);
  grid.source = session.source;
  const disconnect = observeCurrentTheme((dark) => {
    grid.theme = dark ? 'darkCompact' : 'compact';
  });
  return () => {
    disconnect();
    grid.remove();
    section.remove();
  };
}
