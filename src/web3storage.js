const { Web3Storage } = require("web3.storage");

const TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDhkNTJhRURENjc0MjdFRTU4YzU3MjBmNDBkRkEzNWVENTEzN0M1NTMiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2Njk1MzYwMzY5MjEsIm5hbWUiOiJmdXNpb24tY2hhaW4ifQ.QOvfgsi8xuaxcGywIHeKTjUMB423P2sWYHqIEhVdgcs";

module.exports = () => {
  const storage = new Web3Storage({ token: TOKEN });

  return storage;
};
