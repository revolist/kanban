import '../demo-host.css';
import '@revolist/revogrid-pro/dist/revogrid-pro.css';
import '@revolist/revogrid-enterprise/dist/revogrid-enterprise.css';
import { resolveKanbanExample, type KanbanExampleFramework } from './examples';

const framework: KanbanExampleFramework = import.meta.env.MODE === 'development'
  ? 'ts'
  : import.meta.env.MODE as KanbanExampleFramework;
const example = resolveKanbanExample(window.location.search);
const captureMode = new URLSearchParams(window.location.search).get('capture');
if (captureMode === 'board') document.documentElement.dataset.capture = captureMode;

async function bootstrap() {
  switch (framework) {
    case 'react': {
      const [{ createElement }, { createRoot }, Demo] = await Promise.all([
        import('react'),
        import('react-dom/client'),
        example.loadReact(),
      ]);
      createRoot(document.querySelector('#app')!).render(
        createElement(Demo as Parameters<typeof createElement>[0]),
      );
      break;
    }
    case 'vue': {
      const [{ createApp }, Demo] = await Promise.all([
        import('vue'),
        example.loadVue(),
      ]);
      createApp(Demo as Parameters<typeof createApp>[0]).mount('#app');
      break;
    }
    case 'angular': {
      await import('zone.js');
      await import('@angular/compiler');
      document.querySelector('#app')!.innerHTML = `<${example.angularSelector}></${example.angularSelector}>`;
      const [{ bootstrapApplication }, Demo] = await Promise.all([
        import('@angular/platform-browser'),
        example.loadAngular(),
      ]);
      await bootstrapApplication(Demo as Parameters<typeof bootstrapApplication>[0]);
      break;
    }
    default: {
      const load = await example.loadTs();
      load('#app');
    }
  }
}

void bootstrap();
