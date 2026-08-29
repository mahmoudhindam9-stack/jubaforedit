const fs = require("fs");
const path = "src/shared/services/erpStore.ts";
let content = fs.readFileSync(path, "utf8");

// The original sed command `sed -i 's/  }/  },/g'` replaced `  }` with `  },` which ruined ALL `}` preceded by two spaces.
// For example:
// `  }[]` -> `  },[]`
// `  };` -> `  },;`
// `  } else` -> `  }, else`
// `  } catch` -> `  }, catch`
// `  } )` -> `  }, )`
// Let's reverse ALL `  },` back to `  }` EXCEPT for those that were originally `  },`.
// Wait, I don't know which were originally `  },`.
// Let's look for backups.
