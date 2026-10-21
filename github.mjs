const query=`query($cursor:String){organization(login:"OffGrid-Pro"){projectV2(number:8){title url items(first:50,after:$cursor){pageInfo{hasNextPage endCursor} nodes{id isArchived fieldValues(first:100){nodes{... on ProjectV2ItemFieldNumberValue{number field{... on ProjectV2FieldCommon{name}}} ... on ProjectV2ItemFieldSingleSelectValue{name field{... on ProjectV2FieldCommon{name}}} ... on ProjectV2ItemFieldDateValue{date field{... on ProjectV2FieldCommon{name}}} ... on ProjectV2ItemFieldTextValue{text field{... on ProjectV2FieldCommon{name}}}}} content{... on Issue{title number url state assignees(first:100){nodes{login}} labels(first:100){nodes{name}}} ... on PullRequest{title number url state assignees(first:100){nodes{login}} labels(first:100){nodes{name}}} ... on DraftIssue{title assignees(first:100){nodes{login}}}}}}}}}`;
export async function loadProject(token,fetcher=fetch) {
 let cursor=null,items=[],title='',url='';
 do {
 const response=await fetcher('https://api.github.com/graphql',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({query,variables:{cursor}}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw new Error(response.status===401?'GitHub rejected the token. Check it and try again.':response.status===403?'GitHub access denied or rate limit reached. Check project access and try later.':`GitHub request failed (${response.status}). Try again.`);
 const result=await response.json();if(result.errors?.length)throw new Error('GitHub could not read the complete project. Check project permissions and organisation access.');
 const project=result.data?.organization?.projectV2;if(!project)throw new Error('Project 8 is unavailable. Check that your token can read the WattSwap project.');
 items.push(...project.items.nodes);title=project.title;url=project.url;
 cursor=project.items.pageInfo.hasNextPage?project.items.pageInfo.endCursor:null;
 if(project.items.pageInfo.hasNextPage&&!cursor)throw new Error('GitHub returned an incomplete page. Please retry.');
 }while(cursor);
 return {items,title,url,syncedAt:new Date().toISOString()};
}
