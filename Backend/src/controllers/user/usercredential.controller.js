import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { Users } from "../../models/users.models.js";

const updateIncome = asyncHandler(async(req,res) => {
   
    const { netIncome = 0 , income = 0 } = req.body
    const user = await Users.findById(req.user._id)
    
    if(income && netIncome) throw new ApiError(400 , "Only one value could be send at a time")
    if(netIncome && netIncome < 0 ) throw new ApiError(400 , "Invalid net Income")
    if(income && income < 0 ) throw new ApiError(400 , "Invalid Income")   

    income ? user.income += income : user.netIncome += netIncome
    const updatedIncome = await user.save({ validateBeforeSave: false })
    if (!updatedIncome) {
        throw new ApiError(500, "Failed to save user Income")
    }
    return res.status(200)
        .json(
            new ApiResponse(200, "income updated", updatedIncome)
        )
})

const getIncomeAndBackBalance = asyncHandler(async (req, res) => {

    const user = await Users.findById(req.user._id)
    return res.status(200)
        .json(
            new ApiResponse(200, "fetched use income and bankbalance", {
                netIncome: user.netIncome,
                bankBalance: user.bankBalance
            })
        )
})

const updateUserPaymentSettings = asyncHandler(async (req, res) => {
  const { payDate, autoApplyMonthly } = req.body;

  const updates = {};
  if (payDate !== undefined) updates.payDate = payDate;
  if (autoApplyMonthly !== undefined) updates.autoApplyMonthly = autoApplyMonthly;

  if(autoApplyMonthly && !payDate){
    throw new ApiError(400 , "payday or autoApplyMonthly is required")
  }else if (updates.autoApplyMonthly === false){
    updates.payDate = null
  }


  console.log(updates)
  const user = await Users.findByIdAndUpdate(
    req.user._id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  res.status(200)
  .json(
    new ApiResponse(200 , "user payment setting updated" , user)
  )
});

export {
    getIncomeAndBackBalance,
    updateIncome,
    updateUserPaymentSettings
}