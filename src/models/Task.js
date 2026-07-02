// src/models/Task.js
import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Task text is required'],
      trim: true,
      minlength: [3, 'Task text must be at least 3 characters'],
      maxlength: [255, 'Task text cannot exceed 255 characters']
    },
    completed: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastModified: {
      type: Date,
      default: Date.now
    }
  },
  {
    // Automatically manage updatedAt as 'lastModified'
    timestamps: { createdAt: false, updatedAt: 'lastModified' },
    // Remove __v version key from responses
    versionKey: false,
    // Transform _id to id in JSON output
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      }
    }
  }
);

// ■■ Indexes ■■■■■■■■■■■■■■■■■■■■■■■
taskSchema.index({ text: 'text' }); // full-text search
taskSchema.index({ completed: 1 }); // filter by status
taskSchema.index({ completed: 1, createdAt: -1 }); // compound index

const Task = mongoose.model('Task', taskSchema);
export default Task;
