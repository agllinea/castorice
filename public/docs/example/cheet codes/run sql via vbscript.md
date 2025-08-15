```
Option Explicit

Dim con, rs, strconn, strSQL, fso, file, output
Dim System
Set System = CreateObject("ActivElk.System")
System.Connect "", "PCM-PP","WFAdmin","test"

' Your SELECT query
strSQL = "SELECT SSC.SSISSubmitContract, CV.ContractVendor, V.VENDOR_ID AS vendorId, (CASE WHEN VR.ShortCode = 'CP' THEN 'ContractParty' WHEN VR.ShortCode = 'CE' THEN 'ContractEntity' WHEN VR.ShortCode = 'PV' THEN 'PayeeVendor' END) AS contractVendorRole, VA.SEQ_VEND_ADDRESS AS seqVendAddress FROM SSISSubmitContract SSC INNER JOIN ContractVendor CV ON CV.ContractRevision = SSC.Contract INNER JOIN Vendor V ON CV.Vendor = V.Vendor INNER JOIN VendorRole VR ON CV.ContractVendorRole = VR.VendorRole INNER JOIN VendorAddress VA ON VA.VendorAddress = V.PrimaryAddress where ssc.contract='{93FC7233-FA9B-44EE-8E99-E4BBAC377927}'"

' Create connection
Set con = CreateObject("ADODB.Connection")
strconn = System.GetConnectionStringFromConfig()

con.ConnectionTimeout = 0
con.CommandTimeout = 0
con.Open strconn

' Open recordset to fetch results
Set rs = CreateObject("ADODB.Recordset")
rs.Open strSQL, con, 1, 1 ' adOpenKeyset=1, adLockReadOnly=1

' Prepare file output
Set fso = CreateObject("Scripting.FileSystemObject")
' Build timestamp for file name: yyyyMMdd_HHmmss
Dim timestamp
timestamp = Year(Now) & _
            Right("0" & Month(Now), 2) & _
            Right("0" & Day(Now), 2) & "_" & _
            Right("0" & Hour(Now), 2) & _
            Right("0" & Minute(Now), 2) & _
            Right("0" & Second(Now), 2)

' Create file with timestamp in name
Set file = fso.CreateTextFile("E:\temp\query_result_" & timestamp & ".txt", True)

' Optional: write headers
Dim i
For i = 0 To rs.Fields.Count - 1
    file.Write rs.Fields(i).Name
    If i < rs.Fields.Count - 1 Then file.Write vbTab
Next
file.WriteLine ""

' Write data rows
Do Until rs.EOF
    For i = 0 To rs.Fields.Count - 1
        If Not IsNull(rs.Fields(i).Value) Then
            file.Write rs.Fields(i).Value
        End If
        If i < rs.Fields.Count - 1 Then file.Write vbTab
    Next
    file.WriteLine ""
    rs.MoveNext
Loop

' Cleanup
file.Close
rs.Close
con.Close

Set file = Nothing
Set fso = Nothing
Set rs = Nothing
Set con = Nothing
```