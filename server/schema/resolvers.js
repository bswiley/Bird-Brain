const { User, Bird, Comment } = require("../models");
const { signToken, AuthenticationError, verifyToken } = require("../utils/auth");

const resolvers = {
  Query: {
    user: async (root, args, context) => {
      const token = verifyToken(context.req);
      if (!token) {
        throw new AuthenticationError('User not authenticated');
      }
      return User.findOne({ email: token.data.email });
    },
    birds: async () => {
      return Bird.find();
    },
    bird: async (_, { birdId }) => {
      return Bird.findOne({birdId:birdId});
    },
    birdSearch: async (_, { query }) => await Bird.find({ birdName: new RegExp(query, 'i') }, 'birdId birdName birdImage')
  },
  Mutation: {
    addUser: async (_, { username, email, password }) => {
      const user = await User.create({ username, email, password });
      const token = signToken(user);

      return { token, user };
    },
    login: async (_, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('User not found');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect password');
      }

      const token = signToken(user);
      return { token, user };
    },
    addBird: async (parent, { birdId, birdName, birdImage, birdAuthor, datePosted, postText }) => {
      const bird = await Bird.create({ birdId, birdName, birdImage, birdAuthor, datePosted, postText });
      // The following code is to verify that the user is logged in uncomment and test before deploying
      //  const token = verifyToken(context.req);
      // if (!token) {
      //   throw new AuthenticationError('User not authenticated');
      // }
      // const user = await User.findOne({ email: token.data.email });
      await User.findOneAndUpdate(
        { username: birdAuthor },
        { $addToSet: { bird: bird._id } }
      );
    
      return bird; // Return the created bird object
    },
    addComment: async (_, { birdId, commentText, commentAuthor }, context) => {
      // The following code is to verify that the user is logged in uncomment and test before deploying
      //  const token = verifyToken(context.req);
      // if (!token) {
      //   throw new AuthenticationError('User not authenticated');
      // }
      // const user = await User.findOne({ email: token.data.email });
      
      const bird = await Bird.findOne({birdId:birdId});

      if (!bird) {
        throw new Error("Bird not found"); 
            }

      const comment = {
        commentText: commentText,
        commentAuthor: commentAuthor,
        createdAt: new Date(),
      };

      bird.comments.push(comment);

      await bird.save();

      return comment;
    },
  },
};

module.exports = resolvers;