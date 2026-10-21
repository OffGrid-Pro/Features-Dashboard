import {writeFile} from 'node:fs/promises';
import {loadProject,publicProject} from './github.mjs';
try {
 const token=process.env.PROJECT_READ_TOKEN;
 if(!token)throw new Error('Add the PROJECT_READ_TOKEN repository Actions secret before deploying.');
 const project=publicProject(await loadProject(token));
 await writeFile(process.argv[2]||'project-data.json',JSON.stringify(project));
 console.log(`Published ${project.items.length} tasks; updated ${project.syncedAt}.`);
} catch(error) {
 console.error(error.message);
 process.exitCode=1;
}
