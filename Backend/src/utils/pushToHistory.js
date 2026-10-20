import { History } from "../models/history/history.models.js"
const pushToHistory = async (Model, userId, docId, field) => {
  const modelDoc = await Model.findOne({ _id: docId, userId })
  if (!modelDoc) {
    throw new Error("Document not found or does not belong to this user")
  }

  let historyDoc = await History.findOne({ userId })

  if (historyDoc) {
    historyDoc = await History.findOneAndUpdate(
      { userId },
      { $push: { [field]: modelDoc } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    )
  } else {
    historyDoc = await History.create({ userId, [field]: [modelDoc] })
  }

  await Model.findOneAndDelete({ _id: docId, userId })

  return historyDoc
}

export default pushToHistory