-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE bdLista.CurrentGroup (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    created_at timestamp
    with
        time zone NOT NULL DEFAULT now(),
        subjectId uuid,
        groupId uuid,
        status USER - DEFINED,
        CONSTRAINT CurrentGroup_pkey PRIMARY KEY (id),
        CONSTRAINT CurrentGroup_groupId_fkey FOREIGN KEY (groupId) REFERENCES bdLista.Group (id),
        CONSTRAINT CurrentGroup_subjectId_fkey FOREIGN KEY (subjectId) REFERENCES bdLista.Subject (id)
);

CREATE TABLE bdLista.Group (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    created_at timestamp
    with
        time zone NOT NULL DEFAULT now(),
        group text,
        CONSTRAINT Group_pkey PRIMARY KEY (id)
);

CREATE TABLE bdLista.Professors (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    created_at timestamp
    with
        time zone NOT NULL DEFAULT now(),
        name text,
        lastName text,
        email text,
        CONSTRAINT Professors_pkey PRIMARY KEY (id)
);

CREATE TABLE bdLista.Students (
    created_at timestamp
    with
        time zone NOT NULL DEFAULT now(),
        fullName text,
        reportCard text,
        id uuid NOT NULL,
        CONSTRAINT Students_pkey PRIMARY KEY (id)
);

CREATE TABLE bdLista.Subject (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    created_at timestamp
    with
        time zone NOT NULL DEFAULT now(),
        professorId uuid DEFAULT gen_random_uuid (),
        Subject text,
        CONSTRAINT Subject_pkey PRIMARY KEY (id),
        CONSTRAINT Subject_professorId_fkey FOREIGN KEY (professorId) REFERENCES bdLista.Professors (id)
);

CREATE TABLE bdLista.TakeAttendance (
    id uuid NOT NULL DEFAULT gen_random_uuid (),
    created_at timestamp
    with
        time zone NOT NULL DEFAULT now(),
        studentId uuid,
        currentGroupId uuid,
        takeAttendanceStudentData json,
        CONSTRAINT TakeAttendance_studentId_fkey FOREIGN KEY (studentId) REFERENCES bdLista.Students (id),
        CONSTRAINT TakeAttendance_currentGroupId_fkey FOREIGN KEY (currentGroupId) REFERENCES bdLista.CurrentGroup (id)
);