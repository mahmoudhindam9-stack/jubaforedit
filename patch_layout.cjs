const fs = require("fs");
const glob = require("glob");

const files = glob.sync("src/**/*.tsx");
files.forEach((file) => {
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("max-w-7xl")) {
    content = content.replace(/max-w-7xl/g, "w-full px-2 lg:px-6");
    fs.writeFileSync(file, content);
    console.log("Patched", file);
  }
});
