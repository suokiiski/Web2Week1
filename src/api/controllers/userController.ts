import {
  addUser,
  deleteUser,
  getAllUsers,
  getUser,
  updateUser,
} from '../models/userModel';
import {Request, Response, NextFunction} from 'express';
import CustomError from '../../classes/CustomError';
import bcrypt from 'bcryptjs';
import {User} from '../../types/DBTypes';
import {MessageResponse, UploadResponse} from '../../types/MessageTypes';
import {validationResult} from 'express-validator';
const salt = bcrypt.genSaltSync(12);

const userListGet = async (
  _req: Request,
  res: Response<User[]>,
  next: NextFunction
) => {
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

const userGet = async (
  req: Request<{id: string}, {}, {}>,
  res: Response<User>,
  next: NextFunction
) => {
  try {
    const id = Number(req.params.id);
    const user = await getUser(id);
    res.json(user);
  } catch (error) {
    next(error);
  }
};

// TDOD: create userPost function to add new user
// userPost should use addUser function from userModel
// userPost should use validationResult to validate req.body
// - user_name should be at least 3 characters long
// - email should be a valid email
// - password should be at least 5 characters long
// userPost should use bcrypt to hash password
const userPost = async (
  req: Request<User>,
  res: Response<UploadResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('userPost validation', messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    const user = req.body;
    user.password = bcrypt.hashSync(user.password, salt);
    if (!user.role) {
      user.role = 'user';
    }

    const userID = await addUser(user);
    const message: UploadResponse = {
      message: 'User added',
      id: userID,
    };
    res.send(message);
  } catch (error) {
    next(error);
  }
};

const userPut = async (
  req: Request<{id: number}, {}, User>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('userPut validation', messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    if (req.user && (req.user as User).role !== 'admin') {
      throw new CustomError('Admin only', 403);
    }

    const user = req.body;

    const result = await updateUser(user, req.params.id);
    console.log('userPut method');

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// TODO: create userPutCurrent function to update current user
// userPutCurrent should use updateUser function from userModel
// userPutCurrent should use validationResult to validate req.body
const userPutCurrent = async (
  req: Request<User>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('userPutCurrent validation', messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    const id = (req.user as User).user_id;
    const result = await updateUser(req.body, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

// TODO: create userDelete function for admin to delete user by id
// userDelete should use deleteUser function from userModel
// userDelete should use validationResult to validate req.params.id
// userDelete should use req.user to get role
const userDelete = async (
  req: Request<{id: number}, {}, User>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('userDelete validation', messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    if (req.user && (req.user as User).role !== 'admin') {
      throw new CustomError('Admin only', 403);
    }

    const result = await deleteUser(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const userDeleteCurrent = async (
  req: Request<User>,
  res: Response<MessageResponse>,
  next: NextFunction
) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages: string = errors
      .array()
      .map((error) => `${error.msg}: ${error.param}`)
      .join(', ');
    console.log('userDeleteCurrent validation', messages);
    next(new CustomError(messages, 400));
    return;
  }

  try {
    if (!(req.user as User)?.user_id) {
      throw new CustomError('No user', 400);
    }
    await deleteUser((req.user as User).user_id);
    res.send({
      message: 'User deleted',
    });
  } catch (error) {
    next(error);
  }
};

const checkToken = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    next(new CustomError('token not valid', 403));
  } else {
    res.json(req.user);
  }
};

export {
  userListGet,
  userGet,
  userPost,
  userPut,
  userPutCurrent,
  userDelete,
  userDeleteCurrent,
  checkToken,
};
