
/* EIA Database Schema. Dette skema er kodet direkte fra oprettelsen, da vores DCD afspejler præcist de værdier skal skal indgå i hver domæneobjekt. Derudover kan vi afspejle PK og FK gennem vores ER-diagram på forhånd. */

/* Vi har desuden valgt at angive all værdier uden æ, ø, å så der ikke opstår friktion overall */

/* --------------------------------------------------------------------------------- */

/* Bruger*/
CREATE TABLE Bruger (
    brugerID        INT PRIMARY KEY IDENTITY(1,1), /* hardcoded til en bruger (da der ikke er krav om mulighed for flere oprettede brugere) */
    navn            NVARCHAR(100) NOT NULL,
    oprettetDato    DATETIME DEFAULT GETDATE() /* opretter automatisk tidspunkt */
);

INSERT INTO Bruger (navn, oprettetDato) VALUES ('EIA Bruger', '2026-04-02');

/* Adresse */
CREATE TABLE Adresse (
    adresseID       INT PRIMARY KEY IDENTITY(1,1),
    vejnavn         NVARCHAR(100) NOT NULL, 
    husnummer       NVARCHAR(10) NOT NULL,
    postnummer      NVARCHAR(10) NOT NULL,
    bynavn          NVARCHAR(100) NOT NULL
);  /* strings (NVARCHAR bruges, da vi skal kunne tage imod danske tegn som æ, å, ø) */

/* Ejendomsdata */
CREATE TABLE Ejendomsdata (
    ejendomsdataID  INT PRIMARY KEY IDENTITY(1,1),
    ejendomstype    NVARCHAR(100),
    byggeaar        INT,
    boligareal      FLOAT, /* når vi anvender decimaler bruges float. Man kunne normalt set også have brugt DOUBLE, men det er ikke en mulighed i T-SQL */
    antalVaerelser  INT,
    grundareal      FLOAT,
    senestHentet    DATETIME DEFAULT GETDATE()
);

/* Ejendomsprofil */
CREATE TABLE Ejendomsprofil (
    ejendomsprofilID    INT PRIMARY KEY IDENTITY(1,1),
    navn                NVARCHAR(200) NOT NULL,
    beskrivelse         NVARCHAR(MAX),
    oprettetDato        DATETIME DEFAULT GETDATE(),

    /* FK's */
    brugerID            INT NOT NULL FOREIGN KEY REFERENCES Bruger(brugerID),
    adresseID           INT NOT NULL FOREIGN KEY REFERENCES Adresse(adresseID),
    ejendomsdataID      INT NOT NULL FOREIGN KEY REFERENCES Ejendomsdata(ejendomsdataID)
);

/* InvesteringsParametre */
 CREATE TABLE InvesteringsParametre (
    investeringsparametreID           INT PRIMARY KEY IDENTITY(1,1),
    ejendomspris                      FLOAT,
    koebsomkostninger                 FLOAT,
    advokatudgifter                   FLOAT,
    tinglysningsudgifter              FLOAT,
    overtagelsesudgifter              FLOAT,
    laanebeloeb                       FLOAT,
    rente                             FLOAT,
    loebetid                          INT,
    afdragsfriPeriode                 INT,
    laanetype                         NVARCHAR(50) CHECK (laanetype IN (
        'Realkreditlaan',
        'Banklaan',
        'Andelsboliglaan',
        'Privatlaan'
    )),/* Vi laver en dropdown menu (check), så brugeren kan vælge mellem hvilket slags lån de har (påvirker ikke regnelogikken, blot til information) */
    planlagteRenoveringOgForbedringer FLOAT,
    renoveringstidspunkt              INT,
    driftsomkostninger                FLOAT,
    udlejning                         BIT, /* 1/0 = true/false */
    maanedligLeje                     FLOAT,
    udlejningsudgifter                FLOAT
);

/* Investeringscase */
CREATE TABLE Investeringscase (
    investeringscaseID      INT PRIMARY KEY IDENTITY(1,1),
    navn                    NVARCHAR(200) NOT NULL,
    beskrivelse             NVARCHAR(MAX),
    oprettetDato            DATETIME DEFAULT GETDATE(),

    /* FK's */
    ejendomsprofilID        INT NOT NULL FOREIGN KEY REFERENCES Ejendomsprofil(ejendomsprofilID),
    investeringsparametreID INT FOREIGN KEY REFERENCES InvesteringsParametre(investeringsparametreID)
);

/* Simulering */
CREATE TABLE Simulering (
    simuleringID        INT PRIMARY KEY IDENTITY(1,1),
    tidshorisont        INT NOT NULL,
    oprettetDato        DATETIME DEFAULT GETDATE(),

    /* FK's */
    investeringscaseID  INT NOT NULL FOREIGN KEY REFERENCES Investeringscase(investeringscaseID)
);

/* SimuleringResultat */
CREATE TABLE SimuleringResultat (
    simuleringResultatID    INT PRIMARY KEY IDENTITY(1,1),
    egenkapitalOverTid      NVARCHAR(MAX),
    cashflowOverTid         NVARCHAR(MAX),
    gaeldOverTid            NVARCHAR(MAX),
    genereretDato           DATETIME DEFAULT GETDATE(),

    /* FK's */
    simuleringID            INT NOT NULL FOREIGN KEY REFERENCES Simulering(simuleringID)
);

/* Sammenligning */
CREATE TABLE Sammenligning (
    sammenligningID     INT PRIMARY KEY IDENTITY(1,1),
    oprettetDato        DATETIME DEFAULT GETDATE(),

    /* FK's */
    brugerID            INT NOT NULL FOREIGN KEY REFERENCES Bruger(brugerID)
);

/* Derudover har i oprettet en ekstra tabel i databasen som ikke indgår i DCD'et men i ER-diagrammet. Da vi har en many-to-many relation, skal der oprettes et mellemled for dette */
CREATE TABLE SammenligningCase (
    PRIMARY KEY (sammenligningID, investeringscaseID),
    sammenligningID     INT NOT NULL FOREIGN KEY REFERENCES Sammenligning(sammenligningID),
    investeringscaseID  INT NOT NULL FOREIGN KEY REFERENCES Investeringscase(investeringscaseID)
);

/* --- TEST AF DB --- */

/* Verificer at alle tabeller eksisterer */
SELECT TABLE_NAME 
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;

/* Verificer at hardcodet bruger er oprettet */
SELECT * FROM Bruger;