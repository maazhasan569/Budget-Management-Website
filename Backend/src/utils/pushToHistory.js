import { History } from "../models/history/history.models.js"
 const pushToHistory = async (Model, userId, docId, field) => {
  const modelDoc = await Model.findOne({ _id: docId, userId })
  if (!modelDoc) {
    throw new Error("Document not found or does not belong to this user")
  }

  let historyDoc = await History.findOne({ userId })

  if (historyDoc) {
    historyDoc[field] = [...(historyDoc[field] || []), modelDoc]
    await historyDoc.save()
  } else {
    historyDoc = await History.create({ userId, [field]: [modelDoc] })
  }

  await Model.findOneAndDelete({ _id: docId, userId })

  return historyDoc
}

export default pushToHistory