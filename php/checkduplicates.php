<?php
    #Path for the error log
    $ERR_LOG_PATH = "../logs/err_log.log";
    $graph_name = $_POST['graphname'];
    #Attempts to connect to the server
    $conn=@mysqli_connect("127.0.0.1","root");
    if (mysqli_connect_errno()) {
        error_log(date('Y-m-d H:i:sO')." ".mysqli_connect_error()."\r\n", 3, $ERR_LOG_PATH);
        die(json_encode(array('Error' => "Error:\n".mysqli_connect_error())));
    }
    #Attempts to connect to the database
	if(!mysqli_select_db($conn,"ohmulator")) {
        error_log(date('Y-m-d H:i:sO')." "."Couldn't select the database\r\n", 3, $ERR_LOG_PATH);
        die(json_encode(array('Error' => "Error:\nCouldn't select the database.")));
    }
    $query="SELECT *
            FROM Circuit
            WHERE Name = '$graph_name';";
    if(!$res1=mysqli_query($conn,$query)) {
        error_log(date('Y-m-d H:i:sO')." ".mysqli_error($conn)."\r\n", 3, $ERR_LOG_PATH);
        die(json_encode(array('Error' => "Error:\nCouldn't perform the query.")));
    }
    #If the query returned an empty set, then the name isn't a duplicate.
    if (mysqli_num_rows($res1)==0) {
        print(json_encode(array('duplicate' => "no"))); 
    } else {
        print(json_encode(array('duplicate' => "yes")));
    }
    mysqli_close($conn);
?>