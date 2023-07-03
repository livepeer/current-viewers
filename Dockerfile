FROM node:20

ADD /current-viewers.mjs /current-viewers.mjs

CMD ["node", "/current-viewers.mjs"];
