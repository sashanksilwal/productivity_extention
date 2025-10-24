global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() },
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
    group: jest.fn(() => Promise.resolve(1)),
  },
  tabGroups: {
    update: jest.fn(() => Promise.resolve()),
  },
  storage: {
    local: {
      get: jest.fn((keys, cb) => cb({})),
      set: jest.fn((data, cb) => cb && cb()),
      remove: jest.fn((key, cb) => cb && cb()),
    },
  },
  scripting: { executeScript: jest.fn() },
  sessions: { getRecentlyClosed: jest.fn(() => Promise.resolve([])) }
};
