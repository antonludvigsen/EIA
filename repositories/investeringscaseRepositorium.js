/*
 * InvesteringscaseRepositorium — håndterer alle DB-skrivninger for investeringscases.
 *
 * Planlagte metoder:
 *   opretInvesteringscase(ejendomsprofilID, navn, beskrivelse)
 *     — indsætter en ny række i Investeringscase og returnerer det auto-genererede investeringscaseID
 *
 *   gemInvesteringsParametre(investeringscaseID, parametre)
 *     — indsætter en ny række i InvesteringsParametre med alle formularfelter fra de 5 trin
 *       og opdaterer Investeringscase.investeringsparametreID med den nye FK
 */
