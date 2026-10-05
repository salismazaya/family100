const { getQuestions, getQuestionById, saveQuestion, deleteQuestion } = require('../src/store/questions');

describe('Questions Store', () => {
  it('should load initial seed questions', () => {
    const list = getQuestions();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(list[0]).toHaveProperty('id');
    expect(list[0]).toHaveProperty('question');
    expect(list[0]).toHaveProperty('answers');
    expect(Array.isArray(list[0].answers)).toBe(true);
  });

  it('should fetch question by id', () => {
    const list = getQuestions();
    const target = list[0];
    const item = getQuestionById(target.id);
    expect(item).toBeDefined();
    expect(item.question).toBe(target.question);
  });

  it('should add a new question and fetch it', () => {
    const newQ = {
      question: "Apa alasan siswa dipanggil ke ruang guru?",
      answers: [
        { answer: "Bantu bawa buku", score: 40 },
        { answer: "Ditegur remedial", score: 35 }
      ]
    };
    const saved = saveQuestion(newQ);
    expect(saved).toHaveProperty('id');
    const fetched = getQuestionById(saved.id);
    expect(fetched.question).toBe("Apa alasan siswa dipanggil ke ruang guru?");
    expect(fetched.answers.length).toBe(2);

    // cleanup
    deleteQuestion(saved.id);
  });
});
