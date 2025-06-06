export const INTERESTING_STUFF = [
  {
    title: "Tower of Fantasy Game Launcher Security Vulnerability",
    date: "2025-4-21",
    summary: "A security vulnerability was found in the Tower of Fantasy game launcher, allowing unauthorized access to Firebase configuration.",
    content: `A Firebase configuration object was found in a string within the game launcher. The good thing is that to access this Firebase database, you need access rights to the account you own.

  Here's the exposed configuration:

  \`\`\`javascript
  const firebaseConfig = {
    apiKey: "0UrCDvMIpTF+MqQNJCMeEvAkRv9FSP++",
    authDomain: "pwrdsdk.firebaseapp.com", // inferred from domain
    projectId: "pwrdsdk", // inferred from domain
    storageBucket: "pwrdsdk.appspot.com", // inferred from domain
    messagingSenderId: "I2J3M0ZaFfHVO1Z8ZLIEcw==", // appears to be base64 encoded
    appId: "", // not found in strings
    measurementId: "", // not found in strings
    databaseURL: "https://pwrdsdk.firebaseio.com"
  };
  \`\`\``,
    tags: ["security", "vulnerability", "tower-of-fantasy", "game-launcher"]
  },
  {
    title: "Tower of Fantasy Game Launcher Security Vulnerability",
    date: "2025-4-21",
    summary: "A security vulnerability was found in the Tower of Fantasy game launcher, allowing unauthorized access to Firebase configuration.",
    content: `A Firebase configuration object was found in a string within the game launcher. The good thing is that to access this Firebase database, you need access rights to the account you own.

  Here's the exposed configuration:

  \`\`\`javascript
  const firebaseConfig = {
    apiKey: "0UrCDvMIpTF+MqQNJCMeEvAkRv9FSP++",
    authDomain: "pwrdsdk.firebaseapp.com", // inferred from domain
    projectId: "pwrdsdk", // inferred from domain
    storageBucket: "pwrdsdk.appspot.com", // inferred from domain
    messagingSenderId: "I2J3M0ZaFfHVO1Z8ZLIEcw==", // appears to be base64 encoded
    appId: "", // not found in strings
    measurementId: "", // not found in strings
    databaseURL: "https://pwrdsdk.firebaseio.com"
  };
  \`\`\``,
    tags: ["security", "vulnerability", "tower-of-fantasy", "game-launcher"]
  }
];