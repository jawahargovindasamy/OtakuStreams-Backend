import User from "../models/User.js";
import { STATUS_CODES } from "../constants/statusCodes.js";

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const { username, avatar } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    // TODO: Also delete user's watchlist and continue watching data

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: error.message,
    });
  }
};
