'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const Module = require('module');

function sourceFromReply(ctx) {
  const reply = ctx.message?.body || ctx.message?.bodyText || '';
  const marker = reply.match(/(?:^|\n)```(?:js|javascript)?\s*\n([\s\S]*?)\n```/i);
  return marker ? marker[1].trim() : null;
}

function compileCommand(source, filename = 'installed-command.js') {
  if (!source || source.length > 100000) throw new Error('Command source is empty or exceeds the 100 KB limit.');
  const sandbox = { module: { exports: {} }, exports: {}, require, __filename: filename, __dirname: path.dirname(filename), console };
  vm.createContext(sandbox);
  const script = new vm.Script(`(function (exports, require, module, __filename, __dirname) {\n${source}\n})`, { filename });
  script.runInContext(sandbox)(sandbox.exports, require, sandbox.module, filename, path.dirname(filename));
  const command = sandbox.module.exports;
  if (!command || typeof command !== 'object' || typeof command.execute !== 'function') {
    throw new Error('Invalid command module: expected an object with execute(ctx).');
  }
  if (!command.name || !/^[a-z0-9_-]{1,40}$/i.test(command.name)) throw new Error('Invalid command name.');
  command.aliases = Array.isArray(command.aliases) ? command.aliases : [];
  command.category = command.category || 'custom';
  command.description = command.description || 'Installed command.';
  command.role = Number.isFinite(Number(command.role)) ? Number(command.role) : 0;
  return command;
}

function remoteSource(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return reject(new Error('Only HTTP(S) command URLs are allowed.'));
    const client = require(parsed.protocol === 'https:' ? 'https' : 'http');
    const req = client.get(parsed, { headers: { 'user-agent': 'MATEO-FMB-command-loader' } }, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) return reject(new Error(`Command URL returned HTTP ${res.statusCode}.`));
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => {
        data += chunk;
        if (data.length > 100000) req.destroy(new Error('Remote command exceeds 100 KB.'));
      });
      res.on('end', () => resolve(data));
    });
    req.setTimeout(15000, () => req.destroy(new Error('Command URL timed out.')));
    req.on('error', reject);
  });
}

module.exports = {
  name: 'cmd',
  aliases: ['command'],
  category: 'system',
  description: 'Install, load, reload, hotload, unload, or bulk-load commands.',
  usage: '/cmd <install|load|reload|hotload|unload|loadall|list> [file/url/raw]',
  role: 3,
  cooldown: 2,

  async execute(ctx) {
    const action = String(ctx.args[0] || 'list').toLowerCase();
    const registry = ctx.registry;
    const dir = path.join(process.cwd(), 'src', 'cmds');

    if (action === 'list') {
      return ctx.reply(ctx.format('Command manager', [
        `Loaded: ${registry.commands.size}`,
        'Install: /cmd install <file_name>.js',
        'Raw: /cmd install rawcode',
        'URL: /cmd install <https://...>',
        'Reply: reply to a JS code block, then /cmd install reply',
        'Lifecycle: load • reload • hotload • unload • loadall',
      ]));
    }

    if (action === 'loadall') {
      const loaded = registry.loadAll ? await registry.loadAll(dir) : [];
      return ctx.reply(ctx.format('Command manager', [`Loaded ${Array.isArray(loaded) ? loaded.length : 0} command(s).`]));
    }

    const name = ctx.args[1];
    if (!name && action !== 'install') return ctx.reply(ctx.error(`Usage: /cmd ${action} <file_name>.js`));

    if (action === 'unload') {
      const command = registry.get?.(name) || registry.commands.get(name);
      if (!command) return ctx.reply(ctx.error(`Command not loaded: ${name}`));
      registry.commands.delete(command.name);
      for (const alias of command.aliases || []) registry.commands.delete(alias);
      return ctx.reply(ctx.format('Command manager', [`Unloaded: ${command.name}`]));
    }

    if (['load', 'reload', 'hotload'].includes(action)) {
      const file = String(name).replace(/\\/g, '/');
      if (!file.endsWith('.js') || file.includes('..') || path.basename(file) !== file) return ctx.reply(ctx.error('Only a command filename such as example.js is allowed.'));
      const target = path.join(dir, file);
      if (!fs.existsSync(target)) return ctx.reply(ctx.error(`Command file not found: ${file}`));
      if (action !== 'load') delete require.cache[require.resolve(target)];
      const command = require(target);
      if (registry.register) registry.register(command);
      else registry.commands.set(command.name, command);
      return ctx.reply(ctx.format('Command manager', [`${action}: ${command.name}`]));
    }

    if (action === 'install') {
      const spec = String(ctx.args[1] || '').trim();
      let source;
      let filename = 'installed-command.js';
      if (spec.toLowerCase() === 'reply') source = sourceFromReply(ctx);
      else if (/^https?:\/\//i.test(spec)) { source = await remoteSource(spec); filename = path.basename(new URL(spec).pathname) || filename; }
      else if (spec.toLowerCase() === 'rawcode') source = ctx.args.slice(2).join(' ');
      else if (spec.endsWith('.js')) {
        filename = path.basename(spec);
        const sourcePath = path.join(dir, filename);
        if (!fs.existsSync(sourcePath)) return ctx.reply(ctx.error(`Local command file not found: ${filename}`));
        source = fs.readFileSync(sourcePath, 'utf8');
      } else source = ctx.args.slice(1).join(' ');

      if (!source) return ctx.reply(ctx.error('No command source found. Use a URL, rawcode, local .js filename, or reply to a JS code block.'));
      const command = compileCommand(source, filename);
      fs.mkdirSync(dir, { recursive: true });
      const target = path.join(dir, path.basename(`${command.name}.js`));
      fs.writeFileSync(target, source, 'utf8');
      delete require.cache[require.resolve(target)];
      if (registry.register) registry.register(command);
      else registry.commands.set(command.name, command);
      return ctx.reply(ctx.format('Command installed', [`Name: ${command.name}`, `File: ${path.basename(target)}`, `Category: ${command.category}`, 'Loaded: yes']));
    }

    return ctx.reply(ctx.error('Usage: /cmd <install|load|reload|hotload|unload|loadall|list> ...'));
  },
};
