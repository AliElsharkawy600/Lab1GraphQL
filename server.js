import { ApolloServer, gql } from "apollo-server";
import mongoose from "mongoose";

import Student from "./models/students.js";
import Course from "./models/courses.js";

const PORT = 3000;
const MONGO_URI = "mongodb://localhost:27017/schoolGQL";

const typeDefs = gql`
  type Student {
    id: ID!
    name: String!
    email: String!
    age: Int!
    major: String
    courses: [Course!]!
  }

  type Course {
    id: ID!
    title: String!
    code: String!
    credits: Int!
    instructor: String!
    students: [Student!]!
  }

  type Query {
    getAllStudents: [Student!]!
    getStudent(id: ID!): Student!
    getAllCourses: [Course!]!
    getCourse(id: ID!): Course!
    searchStudentsByMajor(major: String!): [Student!]!
  }

  type Mutation {
    addStudent(
      name: String!
      email: String!
      age: Int!
      major: String
    ): Student!

    updateStudent(
      id: ID!
      name: String
      email: String
      age: Int
      major: String
    ): Student!

    deleteStudent(id: ID!): Boolean!

    addCourse(
      title: String!
      code: String!
      credits: Int!
      instructor: String!
    ): Course!

    updateCourse(
      id: ID!
      title: String
      code: String
      credits: Int
      instructor: String
    ): Course!

    deleteCourse(id: ID!): Boolean!
  }
`;

const resolvers = {
  Query: {
    getAllStudents: async () => {
      const allStudents = await Student.find().populate("courses");
      return allStudents;
    },
    getStudent: async (_, { id }) => {
      const student = await Student.findById(id).populate("courses");
      return student;
    },
    getAllCourses: async () => {
      const allCourses = await Course.find();
      return allCourses;
    },
    getCourse: async (_, { id }) => {
      const course = await Course.findById(id);
      return course;
    },
    searchStudentsByMajor: async (_, { major }) => {
      //   console.log("'➡️➡️➡️➡️➡️ ",major)
      const matchedStudents = await Student.find({
        major: { $regex: `^${major}$`, $options: "i" },
      }).populate("courses");
      return matchedStudents;
    },
  },

  Mutation: {
    addStudent: async (_, { name, email, age, major }) => {
      const newStudent = await Student.create({ name, email, age, major });
      return newStudent;
    },
    updateStudent: async (_, { id, name, email, age, major }) => {
      const updateFields = {};
      if (typeof name !== "undefined") updateFields.name = name;
      if (typeof email !== "undefined") updateFields.email = email;
      if (typeof age !== "undefined") updateFields.age = age;
      if (typeof major !== "undefined") updateFields.major = major;

      const updatedStudent = await Student.findByIdAndUpdate(id, updateFields, {
        new: true,
        runValidators: true,
      });
      return updatedStudent;
    },
    deleteStudent: async (_, { id }) => {
      const deletedStudent = await Student.findByIdAndDelete(id);
      return Boolean(deletedStudent);
    },
    addCourse: async (_, { title, code, credits, instructor }) => {
      const newCourse = await Course.create({
        title,
        code,
        credits,
        instructor,
      });
      return newCourse;
    },
    updateCourse: async (_, { id, title, code, credits, instructor }) => {
      const updateFields = {};
      if (typeof title !== "undefined") updateFields.title = title;
      if (typeof code !== "undefined") updateFields.code = code;
      if (typeof credits !== "undefined") updateFields.credits = credits;
      if (typeof instructor !== "undefined")
        updateFields.instructor = instructor;

      const updatedCourse = await Course.findByIdAndUpdate(id, updateFields, {
        new: true,
        runValidators: true,
      });

      if (!updatedCourse) {
        throw new Error(`Course with id "${id}" not found`);
      }

      return updatedCourse;
    },
    deleteCourse: async (_, { id }) => {
      const deletedCourse = await Course.findByIdAndDelete(id);
      if (!deletedCourse) {
        return false;
      }
      //delete course from student
      await Student.updateMany({ courses: id }, { $pull: { courses: id } });
      return true;
    },
  },
  Student: {
    courses: async (student) => {
      if (!student.courses || !student.courses.length) {
        return [];
      }

      if (typeof student.courses[0]?.title !== "undefined") {
        return student.courses;
      }

      const courseIds = student.courses.map((course) => course?._id ?? course);
      return Course.find({ _id: { $in: courseIds } });
    },
  },
  Course: {
    students: (course) => {
      const courseId = course._id ?? course.id;
      return Student.find({ courses: courseId });
    },
  },
};

//
const server = new ApolloServer({ typeDefs, resolvers });

server.listen(PORT, () => {
  console.log(`App Running on http://localhost:${PORT}/graphql`);
  console.log("➡️➡️➡️➡️", MONGO_URI, PORT);
  mongoose
    .connect(MONGO_URI)
    .then(() => console.log("✅✅ Connected to MongoDB"))
    .catch((err) => console.error("❌❌ Error connecting to MongoDB", err));
});
