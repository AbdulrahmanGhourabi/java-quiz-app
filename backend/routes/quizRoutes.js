const express = require('express');
const router  = express.Router();
const db      = require('../config/db');


const questions = [
  {
    id: 1,
    points: 5,
    question: 'What is the correct way to declare an integer variable in Java?',
    options: ['var x = 5;', 'int x = 5;', 'x = 5;', 'declare int x = 5;'],
    answer: 1
  },
  {
    id: 2,
    points: 8,
    question: 'Which keyword is used to create an object in Java?',
    options: ['create', 'object', 'new', 'make'],
    answer: 2
  },
  {
    id: 3,
    points: 10,
    question: 'What does the "static" keyword mean in a method declaration?',
    options: [
      'The method cannot be changed',
      'The method belongs to the class, not to instances',
      'The method runs automatically at startup',
      'The method is private to the package'
    ],
    answer: 1
  },
  {
    id: 4,
    points: 10,
    question: 'Which of the following correctly implements inheritance in Java?',
    options: [
      'class Dog implements Animal {}',
      'class Dog extends Animal {}',
      'class Dog inherits Animal {}',
      'class Dog uses Animal {}'
    ],
    answer: 1
  },
  {
    id: 5,
    points: 12,
    question: 'What is the output of: System.out.println(10 / 3); in Java?',
    options: ['3.33', '3', '3.0', '4'],
    answer: 1
  },
  {
    id: 6,
    points: 12,
    question: 'Which interface must be implemented to allow sorting of objects using Collections.sort()?',
    options: ['Sortable', 'Comparable', 'Comparator', 'Orderable'],
    answer: 1
  },
  {
    id: 7,
    points: 13,
    question: 'What is the difference between ArrayList and LinkedList in Java?',
    options: [
      'ArrayList uses a doubly linked structure; LinkedList uses an array',
      'ArrayList is backed by a dynamic array; LinkedList uses nodes with pointers',
      'They are identical — just different syntax',
      'LinkedList cannot store duplicate values'
    ],
    answer: 1
  },
  {
    id: 8,
    points: 10,
    question: 'What will the following code print?\ntry { int[] a = new int[5]; a[10] = 3; } catch (Exception e) { System.out.println("caught"); } finally { System.out.println("finally"); }',
    options: [
      'caught',
      'finally',
      'caught\nfinally',
      'An unhandled exception is thrown'
    ],
    answer: 2
  },
  {
    id: 9,
    points: 10,
    question: 'What is the purpose of the "volatile" keyword in Java multithreading?',
    options: [
      'It prevents a variable from ever being modified',
      'It ensures a variable is always read from main memory, not a thread-local cache',
      'It makes a variable accessible across different packages',
      'It forces synchronization on the entire method block'
    ],
    answer: 1
  },
  {
    id: 10,
    points: 10,
    question: 'Which design pattern is described as: "Defines a skeleton of an algorithm in a base class, deferring some steps to subclasses without changing the overall structure"?',
    options: [
      'Strategy Pattern',
      'Observer Pattern',
      'Template Method Pattern',
      'Decorator Pattern'
    ],
    answer: 2
  }
];

const TOTAL_POINTS = questions.reduce((s, q) => s + q.points, 0);


router.get('/questions', (req, res) => {
  const safe = questions.map(({ answer, ...q }) => q);
  res.json({ questions: safe, totalPoints: TOTAL_POINTS });
});


router.post('/submit', async (req, res) => {
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers) || answers.length !== questions.length)
    return res.status(400).json({ message: 'Invalid answers array' });

  let raw = 0;
  const breakdown = questions.map((q, i) => {
    const correct = answers[i] === q.answer;
    if (correct) raw += q.points;
    return {
      questionId:    q.id,
      question:      q.question,
      points:        q.points,
      yourAnswer:    q.options[answers[i]] ?? 'No answer',
      correctAnswer: q.options[q.answer],
      correct
    };
  });

  const score = Math.round((raw / TOTAL_POINTS) * 100);

  const grade = (() => {
    if (score >= 90) return { letter: 'A', emoji: '🏆', color: '#FFD700', message: 'Outstanding. You have a mastery-level command of Java. Keep pushing the boundaries.' };
    if (score >= 70) return { letter: 'B', emoji: '⭐', color: '#C0C0C0', message: 'Solid work. Your understanding is strong — a little more practice and you will reach the top.' };
    if (score >= 50) return { letter: 'C', emoji: '📚', color: '#CD7F32', message: 'You are on the right path. Review the concepts you missed and try again — progress is progress.' };
    if (score >= 40) return { letter: 'D', emoji: '💡', color: '#FF8C00', message: 'You have grasped the basics. Study the fundamentals more deeply and retake the quiz.' };
    return         { letter: 'F', emoji: '📖', color: '#e74c3c', message: 'Every expert was once a beginner. Study the core concepts carefully and give it another try!' };
  })();

  try {
    await db.query(
      'INSERT INTO quiz_results (user_id, score, total, answers) VALUES (?, ?, ?, ?)',
      [req.user.id, score, TOTAL_POINTS, JSON.stringify(answers)]
    );
  } catch (err) {
    console.error('DB insert error:', err.message);
    // Still return result even if DB fails
  }

  res.json({ score, rawScore: raw, totalPoints: TOTAL_POINTS, grade, breakdown });
});


router.get('/history', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT score, total, submitted_at FROM quiz_results WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('History error:', err.message);
    res.status(500).json({ message: 'Server error fetching history' });
  }
});

module.exports = router;