export async function paginate(Model, options = {}) {
    let {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortType = -1,
        id = null,
        userId = null,
        category = null,
    } = options;

    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.max(1, parseInt(limit, 10) || 10);
    
    let sortObj = {}
    if (sortBy) {
        const sortDirection = sortType === "desc" ? -1 : 1;
        sortObj[sortBy] = sortDirection
    } else {
        sortObj.createdAt = -1
    }
    
    let filterObj = {}
    
    
    if (id) filterObj.id = id;
    if (userId) filterObj.userId = userId;  
    if (category) filterObj.category = category;
    
    const skip = (page - 1) * limit
    
    try {
        const totalDoc = await Model.countDocuments(filterObj)
        const totalPages = Math.ceil(totalDoc / limit)
        
        if (totalDoc === 0) return {
            totalDoc: 0,
            totalPages: 0,
            fetchedDoc: [],
            page,
            limit,
        }
        
        const fetchedDoc = await Model
            .find(filterObj)
            .sort(sortObj)
            .skip(skip)
            .limit(limit)
            .exec()

        return { totalDoc, totalPages, fetchedDoc, page, limit }
    } catch (error) {
        throw new ApiError(500, error.message)
    }
}