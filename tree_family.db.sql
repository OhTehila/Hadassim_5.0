CREATE TABLE People (
    Person_Id INT PRIMARY KEY,
    Personal_Name VARCHAR(50),
    Family_Name VARCHAR(50),
    Gender VARCHAR(10),
    Father_Id INT,
    Mother_Id INT,
    Spouse_Id INT
);

INSERT INTO People (Person_Id, Personal_Name, Family_Name, Gender, Father_Id, Mother_Id, Spouse_Id) VALUES
(1, 'אדם', 'כהן', 'זכר', NULL, NULL, 2),
(2, 'חוה', 'כהן', 'נקבה', NULL, NULL, NULL),
(3, 'קין', 'כהן', 'זכר', 1, 2, NULL),
(4, 'הבל', 'כהן', 'זכר', 1, 2, NULL),
(5, 'שת', 'כהן', 'זכר', 1, 2, NULL),
(6, 'יעל', 'כהן', 'נקבה', NULL, NULL, 5),
(7, 'רחל', 'כהן', 'נקבה', 1, 2, NULL);

SELECT * FROM People;

CREATE TABLE Family_Tree AS
SELECT Person_Id, Father_Id AS Relative_Id, 'אב' AS Connection_Type FROM People WHERE Father_Id IS NOT NULL
UNION ALL
SELECT Person_Id, Mother_Id, 'אם' FROM People WHERE Mother_Id IS NOT NULL
UNION ALL
SELECT Father_Id, Person_Id, CASE WHEN P.Gender = 'זכר' THEN 'בן' ELSE 'בת' END 
FROM People P
WHERE Father_Id IS NOT NULL
UNION ALL
SELECT Mother_Id, Person_Id, CASE WHEN P.Gender = 'זכר' THEN 'בן' ELSE 'בת' END
FROM People P
WHERE Mother_Id IS NOT NULL
UNION ALL
SELECT P1.Person_Id, P2.Person_Id, CASE WHEN P1.Gender = 'זכר' THEN 'בת זוג' ELSE 'בן זוג' END
FROM People P1
JOIN People P2 ON P1.Spouse_Id = P2.Person_Id
WHERE P1.Spouse_Id IS NOT NULL
UNION ALL
SELECT P1.Person_Id, P2.Person_Id, CASE WHEN P2.Gender = 'זכר' THEN 'אח' ELSE 'אחות' END
FROM People P1
JOIN People P2 ON P1.Father_Id = P2.Father_Id AND P1.Person_Id <> P2.Person_Id
WHERE P1.Father_Id IS NOT NULL;

SELECT * FROM Family_Tree;

INSERT INTO Family_Tree (Person_Id, Relative_Id, Connection_Type)
SELECT P2.Person_Id, P1.Person_Id, CASE WHEN P2.Gender = 'זכר' THEN 'בת זוג' ELSE 'בן זוג' END
FROM People P1
JOIN People P2 ON P1.Spouse_Id = P2.Person_Id
WHERE P2.Spouse_Id IS NULL;

SELECT * FROM Family_Tree;