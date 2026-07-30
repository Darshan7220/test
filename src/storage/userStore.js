import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

export class UserStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.users = [];
  }

  async init() {
    try {
      const contents = await readFile(this.filePath, 'utf8');
      const users = JSON.parse(contents);

      if (!Array.isArray(users)) {
        throw new Error('User data must be a JSON array.');
      }

      this.users = users;
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }

      await mkdir(path.dirname(this.filePath), { recursive: true });
      await this.persist();
    }
  }

  async findByEmail(email) {
    return this.users.find((user) => user.email === email) || null;
  }

  async findById(id) {
    return this.users.find((user) => user.id === id) || null;
  }

  async create({ email, passwordHash }) {
    const user = {
      id: randomUUID(),
      email,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    this.users.push(user);
    await this.persist();
    return user;
  }

  async persist() {
    const temporaryPath = `${this.filePath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(this.users, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, this.filePath);
  }
}
