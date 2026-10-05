const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/questions.json');

let cachedQuestions = null;

function loadFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      cachedQuestions = JSON.parse(raw);
      return cachedQuestions;
    }
  } catch (err) {
    console.error('Error reading questions file:', err.message);
  }
  cachedQuestions = [];
  return cachedQuestions;
}

function saveToDisk(data) {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing questions file:', err.message);
  }
}

function getQuestions() {
  if (!cachedQuestions) {
    loadFromDisk();
  }
  return cachedQuestions;
}

function getQuestionById(id) {
  const list = getQuestions();
  return list.find(q => q.id === id) || null;
}

function saveQuestion(questionData) {
  const list = getQuestions();
  const id = questionData.id || `q_${Date.now()}`;
  const newItem = {
    id,
    question: questionData.question,
    answers: questionData.answers || []
  };

  const existingIdx = list.findIndex(q => q.id === id);
  if (existingIdx >= 0) {
    list[existingIdx] = newItem;
  } else {
    list.push(newItem);
  }

  saveToDisk(list);
  return newItem;
}

function deleteQuestion(id) {
  const list = getQuestions();
  const filtered = list.filter(q => q.id !== id);
  cachedQuestions = filtered;
  saveToDisk(filtered);
  return true;
}

module.exports = {
  getQuestions,
  getQuestionById,
  saveQuestion,
  deleteQuestion,
  loadFromDisk
};
