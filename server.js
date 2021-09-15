const {Client, Intents} = require('discord.js');
const fs = require('fs');
const yaml = require('yaml');
const config = yaml.parse(fs.readFileSync('config.yaml', 'utf8'));
const client = new Client({ws: {
  intents: new Intents(Intents.ALL).remove(
      ['GUILD_MEMBERS', 'GUILD_BANS', 'GUILD_EMOJIS', 'GUILD_INTEGRATIONS', 'GUILD_WEBHOOKS', 'GUILD_INVITES', 'GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_MESSAGE_TYPING', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 'DIRECT_MESSAGE_TYPING'],
  )},
});

client.deletedroles = new Array();
client.ohalmembers = new Array();
client.whitelimit = new Map();
client.bots = new Array();

for (let i = 0; i < config.SecondTokens.length; i++) {
  const cli = new Client();
  cli.login(config.SecondTokens[i]);
  cli.on('ready', () => client.bots.push(cli));
};

client.on('ready', async () => {
  client.user.setPresence({activity: {name: config.Custom_Status}, type: 'PLAYING', status: 'dnd'})
      .then(console.log('PASS - '+ client.user.tag +' Online.'))
      .catch(() => console.log('PASS - Belirsiz bir hata ile karşılaşıldı.'));
  await SaveBackup(); 
  setInterval(async () => {
  client.whitelimit.clear();
  await SaveBackup();
  }, 1000 * 60 * 60 * 1);
  await SetBackup(); setInterval(async () => SetBackup(), 1000 * 60 * 15);
});

client.on('roleDelete', async (role) => {
  client.deletedroles.push(role.id);
  const event = await role.guild.fetchAuditLogs({limit: 1, type: 32}).then((x) => x.entries.first());
  if (!event || !event.executor ) return;
  if (config.Whitelist_Members.includes(event.executor.id) === true) {
    if (client.whitelimit.get(event.executor.id) || 0 >= 4 ) {
      role.guild.roles.cache.filter((role) => ['ADMINISTRATOR', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'MANAGE_GUILD'].some((ytperm) => role.permissions.has(ytperm)) == true && role.guild.members.cache.get(client.user.id).roles.highest.rawPosition > role.rawPosition).forEach((ytrolu) => ytrolu.setPermissions(0));
      await role.guild.members.ban(event.executor.id, {reason: 'Rol silindi.'}).then(async () => {
        client.channels.cache.get(config.Log_Channel).send(`✈️ @everyone <@${event.executor.id}> (\`${event.executor.id}\`) kişisi günlük limitini doldurarak **${role.name}** (\`${role.id}\`) adlı rolü sildiği için yasaklandı.`).catch(() => {});
        await SetBackup();
      }).catch(() => {
        client.channels.cache.get(config.Log_Channel).send(`🚧 @everyone <@${event.executor.id}> (\`${event.executor.id}\`) kişisi günlük limitini doldurarak **${role.name}** (\`${role.id}\`) adlı rolü sildi fakat yasaklanamadı.`).catch(() => {});
        client.ohalmembers.push(event.executor.id);
      });
    } else {
      let x = client.whitelimit.get(event.executor.id) || 0;
      client.whitelimit.set(event.executor.id, x++);
      client.deletedroles.shift(role.id);
    };
  } else {
    await role.guild.members.ban(event.executor.id, {reason: 'Rol silindi.'}).then(async () => {
      role.guild.roles.cache.filter((role) => ['ADMINISTRATOR', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'MANAGE_GUILD'].some((ytperm) => role.permissions.has(ytperm)) == true && role.guild.members.cache.get(client.user.id).roles.highest.rawPosition > role.rawPosition).forEach((ytrolu) => ytrolu.setPermissions(0));
      client.channels.cache.get(config.Log_Channel).send(`✈️ @everyone <@${event.executor.id}> (\`${event.executor.id}\`) kişisi **${role.name}** (\`${role.id}\`) adlı rolü sildiği için yasaklandı rol dağıtılmaya başlanıyor.`).catch(() => {});
      await SetBackup();
    }).catch(() => {
      client.ohalmembers.push(event.executor.id);
      role.guild.roles.cache.filter((role) => ['ADMINISTRATOR', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'MANAGE_GUILD'].some((ytperm) => role.permissions.has(ytperm)) == true && role.guild.members.cache.get(client.user.id).roles.highest.rawPosition > role.rawPosition).forEach((ytrolu) => ytrolu.setPermissions(0));
      client.channels.cache.get(config.Log_Channel).send(`🚧 @everyone <@${event.executor.id}> (\`${event.executor.id}\`) kişisi **${role.name}** (\`${role.id}\`) adlı rolü sildi fakat **YASAKLANAMADI**`).catch(() => {});
    });
  };
});

client
    .on('guildMemberRemove', (member) => {
      if (client.ohalmembers.includes(member.id) === true) return client.ohalmembers.shift(member.id);
    })
    .on('disconnect', () => console.log('ERROR - Bot bağlantısı kesildi'))
    .on('reconnecting', () => console.log('WARN - Bot tekrar bağlanıyor...'))
    .on('error', (e) => console.log('ERROR - '+e+''))
    .on('warn', (w) => console.log('WARN - '+w+''))
    .login(config.Bot_Token).catch(() => console.log('ERROR - BAĞLANILAMADI'));

process
    .on('unhandledRejection', (err) => console.log('ERROR - '+err+''))
    .on('warning', (warn) => console.log('ERROR - '+warn+''));

async function SaveBackup() {
  if (client.ohalmembers.length !== 0 ) return;
  const guild = client.guilds.cache.get(config.GuildID); if (!guild) return;
  const roles = guild.roles.cache.filter((x) => x.name !== '@everyone' && x.managed == false).map((role) => role.id);
  for (let i = 0; i < roles.length; i++) {
    const role = guild.roles.cache.get(roles[i]); if (!role) return; chp = [];
    guild.channels.cache.filter((x) => x.permissionOverwrites.has(role.id) === true).forEach((x) => {
      chp.push({id: x.id, allow: x.permissionOverwrites.get(role.id).allow.toArray(), deny: x.permissionOverwrites.get(role.id).deny.toArray(), type: x.type});
    });
    fs.writeFile('./db/roles/'+role.id+'.json', JSON.stringify({
      id: role.id,
      members: role.members.map((x) => x.id),
      name: role.name,
      color: role.hexColor,
      position: role.position,
      hoisted: role.hoist,
      perms: role.permissions,
      chperms: chp,
    }), (err) => {
      if (err) throw err;
    });
  } console.log('PASS - Roller yedeklendi.');
};

async function SetBackup() {
  if (client.ohalmembers.length !== 0 ) return;
  if (client.deletedroles.length === 0 ) return;
  const guild = client.guilds.cache.get(config.GuildID);
  guild.roles.cache.filter((role) => ['ADMINISTRATOR', 'BAN_MEMBERS', 'KICK_MEMBERS', 'MANAGE_ROLES', 'MANAGE_CHANNELS', 'MANAGE_GUILD'].some((ytperm) => role.permissions.has(ytperm)) == true && guild.members.cache.get(client.user.id).roles.highest.rawPosition > role.rawPosition).forEach((ytrolu) => ytrolu.setPermissions(0));
  for (let i = 0; i < client.deletedroles.length; i++) {
    fs.readFile('./db/roles/'+client.deletedroles[i]+'.json', 'utf-8', async function(err, f) {
      if (!f) return;
      const data = JSON.parse(f);
      await guild.roles.create({
        data: {
          name: data.name,
          color: data.color,
          hoist: data.hoist,
          position: data.position,
          permissions: data.perms,
          mentionable: false}})
          .then(async (role) => {
            if (data.chperms) {
              data.chperms.forEach(async (dta) => {
                const channel = guild.channels.cache.get(dta.id); if (!channel) return;
                await new Promise((r) => setTimeout(r, 5000));
                const mep = new Map();
                data.allow.forEach((p) => mep[p] == true );
                data.deny.forEach((p) => mep[p] == false );
                channel.createOverwrite(role, mep).catch();
              });
            }
            if (!data.members || data.members.length === 0) return;
            client.channels.cache.get(config.Log_Channel).send(`📑 **${role.name}** (\`${role.id}\`) adlı silinen rol tekrar oluşturuldu ve [\`${data.members.length}\`] kişiye dağıtılmaya başlanıyor.`).catch(() => {});
            for (let i = 0; i < data.members.length; i++) {
              const cle = client.bots[Math.floor(Math.random() * client.bots.length)];
              const guild = cle.guilds.cache.get(config.GuildID);
              const rolee = guild.roles.cache.find((r) => r.id === role.id); if (!rolee) return;
              const member = guild.members.cache.find((x) => x.id === data.members[i]); if (!member) return;
              member.roles.add(rolee).catch(() => {});
              await new Promise((r) => setTimeout(r, 250));
            };
          });
    });
    client.deletedroles.shift(client.deletedroles[i]);
  };
};
