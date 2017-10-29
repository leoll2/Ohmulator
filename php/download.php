<?php
    #Path for the error log
    $ERR_LOG_PATH = "../logs/err_log.log";
    #Attempts to connect to the server
    $conn=@mysqli_connect("127.0.0.1","root");
    if (mysqli_connect_errno()) {
        error_log(date('Y-m-d H:i:sO')." ".mysqli_connect_error()."\r\n", 3, $ERR_LOG_PATH);
        die(json_encode(array('Error' => "Error:\n".mysqli_connect_error())));
    }
    #Sanitizes input
    $item = mysqli_real_escape_string($conn, $_POST['item']);
    $graphID = mysqli_real_escape_string($conn, $_POST['graphID']);
    if ($item !== "Arc" && $item !== "Nodes" && $item !== "Omega") {
        error_log(date('Y-m-d H:i:sO')." "."Attempt to use the table $item \r\n", 3, $ERR_LOG_PATH);
        die(json_encode(array('Error' => "Error:\nInvalid request.\nCouldn't load objects of type: $item")));
    };
    #Selects the database
	if(!mysqli_select_db($conn,"ohmulator")) {
        error_log(date('Y-m-d H:i:sO')." "."Couldn't select the database\r\n", 3, $ERR_LOG_PATH);
        die(json_encode(array('Error' => "Error:\nCouldn't select the database.")));
    }
    #Download of omega
    if ($item === "Omega") {
        $query1="SELECT Omega
                 FROM Circuit C
                 WHERE C.Name = '$graphID';";
        if(!$res1=mysqli_query($conn,$query1)) {
            error_log(date('Y-m-d H:i:sO')." ".mysqli_error($conn)."\r\n", 3, $ERR_LOG_PATH);
            die(json_encode(array('Error' => "Error:\nCouldn't run the query.")));
        }
        $row=mysqli_fetch_assoc($res1);
        $omega=$row['Omega'];
        mysqli_close($conn);
        print(json_encode(array('Omega' => $omega)));
    } else {
        #download of branches or nodes
        $query1="SELECT * 
                 FROM $item INNER JOIN Circuit C USING (GraphID)
                 WHERE C.Name = '$graphID';";
        $rows=array();
        if(!$res1=mysqli_query($conn,$query1)) {
            error_log(date('Y-m-d H:i:sO')." ".mysqli_error($conn)."\r\n", 3, $ERR_LOG_PATH);
            die(json_encode(array('Error' => "Error:\nCouldn't run the query.")));
        }
        while ($row=mysqli_fetch_assoc($res1)){
            $rows[] = $row;
        }
        mysqli_close($conn);
        print json_encode($rows);
    }
?>