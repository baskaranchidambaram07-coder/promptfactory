require('dotenv').config({ path: '../backend/.env' });
const bcrypt = require('bcryptjs');
const { sequelize, User, Prompt } = require('../backend/models');

const seed = async () => {
  await sequelize.sync({ force: true });
  console.log('DB synced (force)');

  const adminPass = await bcrypt.hash('admin123', 12);
  const userPass = await bcrypt.hash('user123', 12);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@promptfactory.com',
    password: adminPass,
    role: 'admin',
  });

  await User.create({
    name: 'John Doe',
    email: 'john@example.com',
    password: userPass,
    role: 'user',
  });

  await User.create({
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: userPass,
    role: 'user',
  });

  const prompts = [
    { title: 'Cartoon Style', text: 'Transform this image into a cartoon style illustration', category: 'style' },
    { title: 'Oil Painting', text: 'Convert this image to look like an oil painting', category: 'style' },
    { title: 'Pencil Sketch', text: 'Transform this image into a pencil sketch drawing', category: 'style' },
    { title: 'Watercolor', text: 'Apply a watercolor painting effect to this image', category: 'style' },
    { title: 'Vintage Filter', text: 'Apply a vintage retro filter to this image', category: 'filter' },
    { title: 'Enhance Quality', text: 'Enhance the quality and sharpness of this image', category: 'enhancement' },
    { title: 'Remove Background', text: 'Remove the background from this image', category: 'editing' },
    { title: 'Add Bokeh', text: 'Add a beautiful bokeh blur effect to the background', category: 'effect' },
  ];

  for (const p of prompts) {
    await Prompt.create({ ...p, created_by: admin.id });
  }

  console.log('Seed complete!');
  console.log('Admin: admin@promptfactory.com / admin123');
  console.log('User:  john@example.com / user123');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
