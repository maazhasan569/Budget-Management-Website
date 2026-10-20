import apiClient from "@/api/axiosClient"

const HISTORY_TYPES = ["expenses", "goals", "loans", "tasks"]

function getRecordType(record) {
  const type = String(record?.type ?? record?.recordType ?? record?.kind ?? "").toLowerCase()
  if (HISTORY_TYPES.includes(type)) return type
  if (type === "expense") return "expenses"
  if (type === "goal") return "goals"
  if (type === "loan") return "loans"
  if (type === "task") return "tasks"
  if ("loanName" in (record ?? {})) return "loans"
  if ("goalName" in (record ?? {})) return "goals"
  if ("loanTargetAmt" in (record ?? {})) return "loans"
  if ("targetAmount" in (record ?? {})) return "goals"
  if ("description" in (record ?? {}) || "document" in (record ?? {})) return "tasks"
  if ("amount" in (record ?? {}) || "category" in (record ?? {})) return "expenses"
  return null
}

function flattenHistoryDocuments(documents) {
  return documents.flatMap((document) => {
    if (!document || typeof document !== "object") return []
    if (document.record && typeof document.record === "object") {
      const type = getRecordType({ ...document, ...document.record })
      return type ? [{ type, record: document.record }] : []
    }

    const groupedRecords = HISTORY_TYPES.flatMap((type) =>
      Array.isArray(document[type])
        ? document[type].map((record) => ({ type, record }))
        : [],
    )
    if (groupedRecords.length) return groupedRecords

    const type = getRecordType(document)
    return type ? [{ type, record: document }] : []
  })
}

function normalizePagination(data, requestedPage, requestedLimit) {
  if (Array.isArray(data?.fetchedDoc)) {
    return {
      records: flattenHistoryDocuments(data.fetchedDoc),
      totalDoc: Number(data.totalDoc) || 0,
      totalPages: Number(data.totalPages) || 0,
      page: Number(data.page) || requestedPage,
      limit: Number(data.limit) || requestedLimit,
      paginated: true,
    }
  }

  if (data && typeof data === "object" && !Array.isArray(data)) {
    const records = flattenHistoryDocuments([data])
    return {
      records,
      totalDoc: records.length,
      totalPages: Math.ceil(records.length / requestedLimit),
      page: requestedPage,
      limit: requestedLimit,
      paginated: false,
    }
  }

  if (data == null) {
    return {
      records: [],
      totalDoc: 0,
      totalPages: 0,
      page: requestedPage,
      limit: requestedLimit,
      paginated: false,
    }
  }

  throw new Error("The history response was not in the expected format.")
}

export async function getHistory({ page = 1, limit = 10 } = {}) {
  const response = await apiClient.get("/user/history", { params: { page, limit } })
  return normalizePagination(response.data?.data, page, limit)
}
