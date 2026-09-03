import mongoose, { Schema } from 'mongoose';

// User
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['STUDENT', 'INSTRUCTOR'], default: 'STUDENT' },
  createdAt: { type: Date, default: Date.now }
});
export const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Course
const CourseSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});
export const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);

// Module
const ModuleSchema = new Schema({
  title: { type: String, required: true },
  order: { type: Number, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true }
});
export const Module = mongoose.models.Module || mongoose.model('Module', ModuleSchema);

// Lesson
const LessonSchema = new Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['TEXT', 'VIDEO'], default: 'TEXT' },
  content: { type: String, required: true },
  order: { type: Number, required: true },
  moduleId: { type: Schema.Types.ObjectId, ref: 'Module', required: true }
});
export const Lesson = mongoose.models.Lesson || mongoose.model('Lesson', LessonSchema);

// Objective
const ObjectiveSchema = new Schema({
  description: { type: String, required: true },
  rubricCriteria: [{ type: String }],
  maxTurns: { type: Number, default: 3 },
  lessonId: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true }
});
export const Objective = mongoose.models.Objective || mongoose.model('Objective', ObjectiveSchema);

// Attempt
const AttemptSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  objectiveId: { type: Schema.Types.ObjectId, ref: 'Objective', required: true },
  conversation: [{ role: String, content: String }],
  turnCount: { type: Number, default: 0 },
  status: { type: String, enum: ['IN_PROGRESS', 'MASTERED', 'PARTIAL', 'OFF_TRACK'], default: 'IN_PROGRESS' },
  coverage: [{ criterionIndex: Number, status: String, reasoning: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
AttemptSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
export const Attempt = mongoose.models.Attempt || mongoose.model('Attempt', AttemptSchema);
