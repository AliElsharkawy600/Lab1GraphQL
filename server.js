const express = require("express");
const { ApolloServer, gql } = require("apollo-server-express");

// In-memory data storage
let students = [
  {
    id: "1",
    name: "Ali Saeed",
    email: "ahmed@iti.edu",
    age: 22,
    major: "Computer Science",
  },
  {
    id: "2",
    name: "Fatma Ali",
    email: "fatma@iti.edu",
    age: 21,
    major: "Information Systems",
  },
];

let courses = [
  {
    id: "1",
    title: "Data Structures",
    code: "CS201",
    credits: 3,
    instructor: "Dr. Mohamed",
  },
  {
    id: "2",
    title: "Database Systems",
    code: "CS301",
    credits: 4,
    instructor: "Dr. Sarah",
  },
];

// Enrollment tracking (studentId -> [courseIds])
let enrollments = {
  1: ["1", "2"], // Ali enrolled in both courses
  2: ["2"], // Fatma enrolled in Database Systems
};

const generateNextId = (Arr) => {
  if (!Arr.length) {
    return "1";
  }

  const maxId = Arr.length;
  return String(maxId + 1);
};

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
    getStudent(id: ID!): Student
    getAllCourses: [Course!]!
    getCourse(id: ID!): Course
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
    getAllStudents: () => students,
    getStudent: (_, { id }) =>
      students.find((student) => student.id === id) || null,
    getAllCourses: () => courses,
    getCourse: (_, { id }) =>
      courses.find((course) => course.id === id) || null,
    searchStudentsByMajor: (_, { major }) =>
      // console.log("hhhhhhhhhhhhhhhh", major)
      students.filter(
        (student) =>
          student.major && student.major.toLowerCase() === major.toLowerCase()
      ),
  },
  Mutation: {
    addStudent: (_, { name, email, age, major }) => {
      const id = generateNextId(students);
      const newStudent = {
        id,
        name,
        email,
        age,
        major: typeof major === "undefined" ? null : major,
      };

      students.push(newStudent);
      enrollments[id] = [];
      return newStudent;
    },
    updateStudent: (_, { id, name, email, age, major }) => {
      const student = students.find((item) => item.id === id);
      if (!student) {
        console.log("No Student");
        return;
      }

      if (typeof name !== "undefined") student.name = name;
      if (typeof email !== "undefined") student.email = email;
      if (typeof age !== "undefined") student.age = age;
      if (typeof major !== "undefined") student.major = major;

      return student;
    },
    deleteStudent: (_, { id }) => {
      const index = students.findIndex((student) => student.id === id);
      if (index === -1) {
        return false;
      }

      students.splice(index, 1);
      delete enrollments[id];
      return true;
    },
    addCourse: (_, { title, code, credits, instructor }) => {
      const id = generateNextId(courses);
      const newCourse = { id, title, code, credits, instructor };
      courses.push(newCourse);
      return newCourse;
    },
    updateCourse: (_, { id, title, code, credits, instructor }) => {
      const course = courses.find((item) => item.id === id);
      if (!course) {
        throw new Error(`Course with id "${id}" not found`);
      }

      if (typeof title !== "undefined") course.title = title;
      if (typeof code !== "undefined") course.code = code;
      if (typeof credits !== "undefined") course.credits = credits;
      if (typeof instructor !== "undefined") course.instructor = instructor;

      return course;
    },
    deleteCourse: (_, { id }) => {
      const index = courses.findIndex((course) => course.id === id);
      if (index === -1) {
        return false;
      }

      courses.splice(index, 1);
      Object.keys(enrollments).forEach((studentId) => {
        enrollments[studentId] = enrollments[studentId].filter(
          (courseId) => courseId !== id
        );
      });

      return true;
    },
  },
};

async function start() {
  const app = express();
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();
  server.applyMiddleware({ app, path: "/graphql" });

  app.listen(5000, () => {
    console.log("App Running on http://localhost:5000/graphql");
  });
}

start();
