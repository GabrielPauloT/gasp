import Reactotron from 'reactotron-react-native';

declare global {
  interface Console {
    tron: typeof Reactotron;
  }
}

const reactotron = Reactotron
  .configure({ name: 'GASP' })
  .useReactNative({
    asyncStorage: false,
    networking: {
      ignoreUrls: /symbolicate|logs/,
    },
    errors: { veto: () => false },
  })
  .connect();

// Patch console.log to also show in Reactotron
const originalLog = console.log;
console.log = (...args: unknown[]) => {
  originalLog(...args);
  reactotron.log?.(...args);
};

console.tron = reactotron;

export default reactotron;
