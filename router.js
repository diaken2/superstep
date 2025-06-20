import express from 'express';
import User from "./models/User.js";
import bcrypt from 'bcryptjs';
import Material from './models/Material.js';
import Test from './models/Test.js'
import Training from './models/Training.js';
import nodemailer from "nodemailer"
const router = express.Router();


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'kenansalahov111@gmail.com',
    pass: 'evfm tcvq urvq ximq' // 16 символов без пробелов
  }
});


async function notifyAllUsers(subject, message) {
  const users = await User.find();
  const emails = users.map(u => u.email).filter(Boolean);

  for (const email of emails) {
    await transporter.sendMail({
      from: '"Обучающая платформа SuperStep LMS для обучения сотрудников" kenansalahov111@gmail.com',
      to: email,
      subject,
      text: message
    });
  }
}
// Registration
router.post('/register', async (req, res) => {
    console.log(req.body)
  try {
  
    const { fullName, email, password, phone, position} = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
fullName,
  email,
  password:hashedPassword,
  phone,
  position,
  role:"user",
  rating: 0,
  testResults: [],
  createdAt: Date.now() ,
    });

    await newUser.save();
    console.log('Успешно')
    console.log(newUser._id)
    res.status(201).json({ userId: newUser._id });
  
   
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при регистрации', error: err });
  }
});


router.get('/tests', async (req, res) => {
  console.log('get')
  try {
    const tests = await Test.find();
    console.log(tests)
    res.json(tests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/trainings/:id/subscribe', async (req, res) => {
  const userId = req.body.userId;
  const tr = await Training.findById(req.params.id);
 
  if(tr.approvedParticipants.includes(userId)){
     res.json(tr);
     return
  }
  if (!tr.participants.includes(userId)) {
    tr.participants.push(userId);
    await tr.save();
  }
  res.json(tr);
});

router.post('/trainings/:id/approve', async (req, res) => {
  const { userId } = req.body;
  const tr = await Training.findById(req.params.id);

  if (!tr) return res.status(404).json({ error: 'Training not found' });

  const isParticipant = tr.participants.includes(userId);
  const isAlreadyApproved = tr.approvedParticipants.includes(userId);

  if (isParticipant && !isAlreadyApproved) {
    tr.approvedParticipants.push(userId);

    // Удаляем из обычных участников
    tr.participants = tr.participants.filter(
      id => id.toString() !== userId
    );

    await tr.save();
  }

  res.json(tr);
});


router.get('/trainings/:id', async (req, res) => {
  const tr = await Training.findById(req.params.id)
    .populate('participants', 'fullName email')
    .populate('approvedParticipants', 'fullName email');
  res.json(tr);
});





router.post('/tests/:id/submit', async (req, res) => {
  const { userId, answers } = req.body;

  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Тест не найден' });

    let correctCount = 0;
    test.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const score = correctCount * 10;

    await User.findByIdAndUpdate(userId, { $inc: { rating: score } });

    res.json({ correct: correctCount, score });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Получить рейтинг пользователей (по убыванию)
router.get('/users/rating', async (req, res) => {
  try {
    const users = await User.find({}, 'fullName email rating') // выбираем только нужные поля
      .sort({ rating: -1 })
      .limit(100); // можно ограничить 100 топ-юзерами
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при получении рейтинга', error: err });
  }
});


router.get('/materials/with-tests', async (req, res) => {
  try {
    console.log('sdsd')
    const materials = await Material.find();
    const materialsWithTests = await Promise.all(
      materials.map(async (material) => {
        const test = await Test.findOne({ materialId: material._id });
        return {
          ...material.toObject(),
          test
        };
      })
    );
    res.json(materialsWithTests);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});




router.post('/tests', async (req, res) => {
  const { title, questions, materialId } = req.body;

  if (!title || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ message: 'Неверные данные' });
  }

  try {
    const newTest = new Test({ title, questions, materialId });
    await newTest.save();
    await notifyAllUsers('Новый тест готов!', `Вы можете пройти новый тест: ${title}`);
    res.status(201).json(newTest);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post('/trainings', async (req, res) => {
  console.log(req.body)
try{
    const { title, description, date } = req.body;
    const training = new Training({ title, description, date });
    await training.save();
    await notifyAllUsers('Новый тренинг доступен!', `Появился новый тренинг: ${training.title}\nОписание: ${training.description}`);

    res.status(201).json(training);
}
catch(e){
    res.status(500).json({ error: 'Ошибка при создании тренинга' });
}
  
});

router.get('/trainings', async (req, res) => {
  console.log(req.body)
  try {
    const trainings = await Training.find().sort({ date: 1 });
    res.json(trainings);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении тренингов' });
  }
});

router.get('/materials', async (req, res) => {
  const materials = await Material.find().sort({ createdAt: -1 });
  res.json(materials);
});

router.post('/materials', async (req, res) => {
  const { title, content, pdfUrl } = req.body;
  const material = new Material({ title, content, pdfUrl });
  await material.save();
   await notifyAllUsers('Новый обучающий материал!', `Добавлен новый материал: ${material.title}`);
  res.status(201).json(material);
});


router.post('/login', async (req, res) => {
  console.log(req.body)
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    console.log(user)

    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Неверный пароль' });

    res.status(200).json({ userId: user._id });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при входе', error: err });
  }
});

// Удалить тест по ID
router.post('/tests/:id', async (req, res) => {
  console.log(req.body)
  try {
    const deleted = await Test.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Тест не найден' });
    res.json({ message: 'Тест удалён' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/materials/:id', async (req, res) => {
  console.log(req.body)
  try {
    const deleted = await Material.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Материал не найден' });
    res.json({ message: 'Материал удалён' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.post('/profile', async (req, res) => {
    console.log("uiiuu")
  try {
    const { userId } = req.body;
    console.log(req.body)
     const user = await User.findById(userId);
     console.log(user)

    if (!user) return res.status(404).json({ message: 'Пользователь не найден' });

    

    res.status(200).json({ user});
  } catch (err) {
    res.status(500).json({ message: 'Ошибка', error: err });
  }
});
export default router;