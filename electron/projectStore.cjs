const fs = require('fs/promises');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

const MANIFEST = 'openscriv.project.json';

function sampleProject(rootDir) {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: 'Untitled Novel',
    rootDir,
    targetWords: 80000,
    updatedAt: now,
    documents: [
      {
        id: crypto.randomUUID(),
        title: 'Draft',
        type: 'folder',
        synopsis: 'Main manuscript folder',
        status: 'Drafting',
        label: 'Manuscript',
        targetWords: 50000,
        children: [
          {
            id: crypto.randomUUID(),
            title: 'Chapter One',
            type: 'document',
            text: 'Start writing here.',
            synopsis: 'Opening chapter',
            status: 'Drafting',
            label: 'Scene',
            targetWords: 1800,
            children: [],
          },
        ],
      },
    ],
  };
}

async function createProject() {
  const rootDir = await fs.mkdtemp(path.join(os.homedir(), 'OpenScriv-'));
  const project = sampleProject(rootDir);
  await saveProject(project);
  return project;
}

async function openProject(rootDir) {
  const raw = await fs.readFile(path.join(rootDir, MANIFEST), 'utf8');
  return JSON.parse(raw);
}

async function saveProject(project) {
  const rootDir = project.rootDir || await fs.mkdtemp(path.join(os.homedir(), 'OpenScriv-'));
  const payload = { ...project, rootDir, updatedAt: new Date().toISOString() };
  await fs.mkdir(rootDir, { recursive: true });
  await fs.writeFile(path.join(rootDir, MANIFEST), JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

module.exports = { createProject, openProject, saveProject };
