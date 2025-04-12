import mongoose, { Schema } from "mongoose"

// User Schema
const userSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  balance: {
    type: Number,
    default: 0,
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  invitationCode: {
    type: String,
    unique: true,
    sparse: true,
  },
  invitationCount: {
    type: Number,
    default: 0,
  },
  // Maximum number of invitation codes a user can generate (default: 2)
  maxInvitationCodes: {
    type: Number,
    default: 2,
  },
  // Track if this user's invitation has earned the bonus
  invitationBonusEarned: {
    type: Boolean,
    default: false,
  },
  // Track earnings from invited users
  invitationEarnings: {
    type: Number,
    default: 0,
  },
  // Track if user has seen the tutorial
  hasSeenTutorial: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Photo Schema
const photoSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tags: {
    type: [String],
    default: [],
  },
  imageData: {
    type: String, // Base64 encoded image data
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  exifData: {
    type: Object,
    default: {},
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  reviewedAt: Date,
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  rejectionReason: String,
})

// Withdrawal Schema
const withdrawalSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  method: {
    type: String,
    enum: ["paypal", "gcash"],
    required: true,
  },
  accountDetails: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "rejected", "failed"],
    default: "pending",
  },
  // Add fee fields
  fee: {
    type: Number,
    default: 0,
  },
  finalAmount: {
    type: Number,
    required: function () {
      return this.fee > 0
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  processedAt: Date,
  processedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  rejectionReason: String,
  failureReason: String,
})

// Notification Schema
const notificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      "photo_approved",
      "photo_rejected",
      "withdrawal_completed",
      "withdrawal_rejected",
      "invitation",
      "system",
      "admin",
    ],
    default: "system",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  relatedId: {
    type: Schema.Types.ObjectId,
    refPath: "relatedModel",
  },
  relatedModel: {
    type: String,
    enum: ["Photo", "Withdrawal", "User", "Platform"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Admin Notification Schema
const adminNotificationSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["new_user", "photo_pending", "withdrawal_pending", "system"],
    default: "system",
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  relatedId: {
    type: Schema.Types.ObjectId,
    refPath: "relatedModel",
  },
  relatedModel: {
    type: String,
    enum: ["Photo", "Withdrawal", "User", "Platform"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Invitation Schema
const invitationSchema = new Schema({
  code: {
    type: String,
    required: true,
    unique: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  usedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  bonusEarned: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  usedAt: Date,
})

// System Settings Schema
const settingsSchema = new Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  value: {
    type: Schema.Types.Mixed,
    required: true,
  },
  description: String,
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
})

// Payment Platform Schema
const platformSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  fee: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  icon: String,
  instructions: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
})

// Export models
export const User = mongoose.models.User || mongoose.model("User", userSchema)
export const Photo = mongoose.models.Photo || mongoose.model("Photo", photoSchema)
export const Withdrawal = mongoose.models.Withdrawal || mongoose.model("Withdrawal", withdrawalSchema)
export const Notification = mongoose.models.Notification || mongoose.model("Notification", notificationSchema)
export const AdminNotification =
  mongoose.models.AdminNotification || mongoose.model("AdminNotification", adminNotificationSchema)
export const Invitation = mongoose.models.Invitation || mongoose.model("Invitation", invitationSchema)
export const Settings = mongoose.models.Settings || mongoose.model("Settings", settingsSchema)
export const Platform = mongoose.models.Platform || mongoose.model("Platform", platformSchema)
