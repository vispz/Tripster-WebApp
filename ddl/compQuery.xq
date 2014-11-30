<database>
<USERS>
{
for $u in doc("project_data.xml")//user
return <tuple><USERNAME>{$u/login/text()}</USERNAME><FIRSTNAME>{
    let $name := tokenize($u/name/text(),'\s')
    return $name[1]
    }</FIRSTNAME><LASTNAME>
    {
      let $name := tokenize($u/name/text(),'\s')
      return
      if(empty( $name[2]))
        then (" ")
      else
        ($name[2])
    }
    </LASTNAME><EMAIL>{
      if (empty($u/email/text()))
        then ("default_email@upenn.edu")
      else
        ($u/email/text())

      }</EMAIL>
    <DOB>1985-11-09</DOB>
    <PASSWORD>password</PASSWORD>
    <PHOTO_URL>http://designyoutrust.com/wp-content/uploads7/designfetishnophotofacebook1.jpg</PHOTO_URL>
    <AFFILIATION>{
      if (empty($u/affiliation/text()))
      then ("Penn")
      else
      ($u/affiliation/text())
      }</AFFILIATION>
    <INTERESTS>{
      if (empty($u/interests/text()))
      then ("TV shows cycling")
      else
      ($u/interests/text())
      }</INTERESTS>
    </tuple>
}
</USERS>

<LOCATION>
{
    let $locs :=  for $li in  doc("project_data.xml")//location
    return $li/name/text()
    let $locs := distinct-values($locs)
    for $l in $locs
    return <tuple><ID>{index-of($locs,$l)}</ID>
    <NAME>{$l}</NAME>
    </tuple>
}
</LOCATION>


<RATE_MEDIA>
{
    let $conts := for $c in doc("project_data.xml")//content
    return $c
    let $media := for $c in $conts
    return 
    <content>
        <ID>{index-of($conts, $c)}</ID>
        {$c/type}
        {$c/url}
        {$c/gr}
        <theirID>{$c/id/text()}</theirID>
        <contentSource>{$c/source/text()}</contentSource>
    </content>

    for $u in doc("project_data.xml")//user
    for $rc in $u/rateContent
    for $m in $media
    where $m/theirID/text() = $rc/contentid/text() 
    and $m/contentSource/text() = $rc/contentSource/text()
    return 
    <tuple> 
    <USERNAME>
        {$u/login/text()}
    </USERNAME>
    <MEDIA_ID>
        {$m/ID/text()}
    </MEDIA_ID>
    <RATING>
        {if (number($rc/score/text()) > number(5))
        then ( string( number($rc/score/text())- number(5) ) )
        else
        ($rc/score/text())
         }
    </RATING>
    <COMMENTS>
        {
          if (empty($rc/comment/text()))
            then (" ")
          else if($rc/comment/text() = "NULL")
            then (" ")
          else 
            (replace($rc/comment/text(),',',''))
        }
    </COMMENTS>
    </tuple>    
}
</RATE_MEDIA>

  <TRIPS>{
for $u in doc("project_data.xml")/tripster/user
for $t in $u/trip
return 
  
    <tuple>
   <ID>{$t/id/text()}</ID>
   <NAME>{$t/name/text()}</NAME>
   <ADMIN>{$u/login/text()}</ADMIN>
   <STARTING>2014-11-23</STARTING>
   <ENDING>2015-01-11</ENDING>
   <PRIVACY>{$t/privacyFlag/text()}</PRIVACY>
    </tuple>
  
}
  </TRIPS>
  

<PARTICIPATES>
{
for $p in doc("project_data.xml")//user
for $r in $p//rateTrip

  return
  
  <tuple>
    <USERNAME>{$p/login/text()}</USERNAME>
    <TRIP_ID>{$r/tripid/text()}</TRIP_ID>
    {
    if (empty($r/comment/text()))
    then <COMMENTS>" "</COMMENTS>
     else <COMMENTS>{$r/comment/text()}</COMMENTS>
   }
    { 
      if($r/tripid/text()=$p/request/tripid/text())
      then (for $req in $p/request
      where $r/tripid/text()=$req/tripid/text()
      return
      <RSVP>{
            $req/status/text()
      }</RSVP>)
      else ( <RSVP>pending</RSVP>)
      
   }
    <RATE>{if (number($r/score/text()) > number(5))
        then ( string( number($r/score/text())- number(5) ) )
        else
        ($r/score/text())
         }
         </RATE>
  </tuple>
}
</PARTICIPATES>

<ALBUMS>
  {
    let $album := doc("project_data.xml")/tripster/user/trip/album
    for $u in doc("project_data.xml")/ tripster/user
    for $t in $u/trip
    for $a in ($t/album)
    
    return 
    <tuple>
        <ID>{index-of($album, $a)}</ID>
        {
          if (empty($a/name/text())) 
          then <NAME>{" "}</NAME> 
          else <NAME>{$a/name/text()}</NAME>
        }
        <USERNAME>{$u/login/text()}</USERNAME>
        <TRIP_ID>{$t/id/text()}</TRIP_ID>
        <PRIVACY>{$a/privacyFlag/text()}</PRIVACY>
    
    </tuple>
  }
</ALBUMS>



<FRIENDS>
{
let $friends :=
for $f in doc("project_data.xml")/tripster/user/friend
let $u := $f/..
where not(empty($f/text()))
return

(<tuple>
<USERNAME1>{concat($u/login/text(), "::")}</USERNAME1>
<USERNAME2>{$f/text()}</USERNAME2>
</tuple>,
<tuple>
<USERNAME1>{concat($f/text(), "::")}</USERNAME1>
<USERNAME2>{$u/login/text()}</USERNAME2>
</tuple>)
let $friends := distinct-values($friends)
for $f in $friends
return
<tuple>
<USERNAME1>{tokenize($f, "::")[1]}</USERNAME1>
<USERNAME2>{tokenize($f, "::")[2]}</USERNAME2>
</tuple>
}
</FRIENDS>

 <MEDIA>
{
 let $locs := doc("project_data.xml")//location
 let $loc := distinct-values($locs)
 let $albums := doc("project_data.xml")/tripster/user/trip/album
 let $content := doc("project_data.xml")/tripster/user/trip/album/content

 let $res := for $c in $content
 let $l := $c/../../location[1]
 where not (empty($l)) 
 return
<tuple>
<ID>{index-of($content, $c)}</ID>
<CAPTION>" "</CAPTION>
<LOC_ID>{index-of($loc, $l)}</LOC_ID>
<URL>{$c/url/text()}</URL>
<ALBUM_ID>{index-of($albums, $c/..)}</ALBUM_ID>
<TYPE>{$c/type/text()}</TYPE>
</tuple>
for $r in $res
order by number($r/ID/text())
return $r

}
</MEDIA>
<DREAMLIST>
{
for $d in doc("project_data.xml")/tripster/user/dream
let $u := $d/..
let $locs := doc("project_data.xml")//location/name
let $loc := distinct-values($locs)
for $l in $loc
where $d = $l
return
<tuple>
<USERNAME>{$u/login/text()}</USERNAME>
<LOC_ID>{index-of($loc, $l)}</LOC_ID>
</tuple>
}
</DREAMLIST>

<LOCATION_TAGS>
  {
    let $locs :=  for $li in  doc("project_data.xml")//location
    return $li/name/text()
    let $locs := distinct-values($locs)
    for $l in $locs
    for $t in doc("project_data.xml")/tripster
    for $tri in $t/user/trip
    where $tri/location/name/text() = $l and
     $tri/location/type/text() != "null" and
      $tri/location/type/text() != "NULL"
      and $tri/location/type/text()!="Destination"
      and $tri/location/type/text()!="DestinationDestinationDestination"
      and $tri/location/type/text()!="DestinationDestinationDestinationDestinationDestination"
    return
    <tuple>
      <TAGNAME>
        {$tri/location/type/text()}
      </TAGNAME>
      <LOC_ID>
        {index-of($locs,$l)}
      </LOC_ID>
    </tuple>
  }
</LOCATION_TAGS>

<TRIP_LOCATION>
  { 
    let $locs :=  for $li in  doc("project_data.xml")//location
    return $li/name/text()
    let $locs := distinct-values($locs)
    for $l in $locs
    for $t in doc("project_data.xml")/tripster
    for $tri in $t/user/trip
    where $tri/location/name/text() = $l
    return
    <tuple>
      <TRIP_ID>
        {$tri/id/text()}
      </TRIP_ID>
      <LOC_ID>
       {index-of($locs,$l)}
      </LOC_ID>
    </tuple>
  }
</TRIP_LOCATION>

<VISITED>
{
   let $locs :=  for $li in  doc("project_data.xml")//location
   return $li/name/text()
   let $locs := distinct-values($locs)
   for $l in $locs
   for $t in doc("project_data.xml")/tripster
   for $u in $t/user
   where $u/trip/location/name/text() = $l
   return
   <tuple>
     <USERNAME>
       {$u/login/text()}
     </USERNAME>
     <LOC_ID>
       {index-of($locs,$l)}
     </LOC_ID>
   </tuple>
  
}
</VISITED>

</database>

