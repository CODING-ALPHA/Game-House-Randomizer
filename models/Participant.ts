import mongoose, { Schema, Model } from "mongoose";

export interface IParticipant {
  gameId: mongoose.Types.ObjectId;
  name: string; // The user's name (common across all games)
  uniqueIdentifier: string; // Used to prevent duplicates if a field is marked as unique
  browserTokenHash?: string;
  data: Record<string, any>; // Dynamic data stored as key-value pairs
  groupName: string; // The assigned group
  createdAt: Date;
}

const ParticipantSchema = new Schema<IParticipant>({
  gameId: { type: Schema.Types.ObjectId, ref: "Game", required: true },
  name: { type: String, required: true },
  uniqueIdentifier: { type: String }, // Can be null if the game has no unique identifier field
  browserTokenHash: { type: String, select: false },
  data: { type: Schema.Types.Mixed, required: true },
  groupName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

// Prevent duplicate registrations using the unique identifier
// We use a sparse index because some games might not use a unique identifier
ParticipantSchema.index(
  { gameId: 1, uniqueIdentifier: 1 },
  { unique: true, sparse: true },
);
ParticipantSchema.index(
  { gameId: 1, browserTokenHash: 1 },
  {
    unique: true,
    partialFilterExpression: { browserTokenHash: { $type: "string" } },
  },
);

const Participant: Model<IParticipant> =
  mongoose.models.Participant ||
  mongoose.model<IParticipant>("Participant", ParticipantSchema);

export default Participant;
